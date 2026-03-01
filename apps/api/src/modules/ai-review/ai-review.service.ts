import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { Ollama } from 'ollama';
import {
  PromptBuilderService,
  AIReviewResponse,
  ReviewIssue,
} from './prompt-builder.service';
import { DiffParserService } from './diff-parser.service';

export interface ReviewResult {
  issues: ReviewIssue[];
  summary: {
    totalIssues: number;
    critical: number;
    warnings: number;
    infos: number;
    overallAssessment: string;
  };
  metrics: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    costUsd: number;
    processingTimeMs: number;
  };
}

@Injectable()
export class AiReviewService {
  private readonly logger = new Logger(AiReviewService.name);
  private anthropicClient: Anthropic;
  private ollamaClient: Ollama;
  private useOllama: boolean;
  private model: string;

  // Claude pricing (as of 2024)
  private readonly INPUT_COST_PER_MILLION = 3.0; // $3 per million input tokens
  private readonly OUTPUT_COST_PER_MILLION = 15.0; // $15 per million output tokens

  constructor(
    private configService: ConfigService,
    private promptBuilder: PromptBuilderService,
    private diffParser: DiffParserService,
  ) {
    // Use Ollama in development mode, Anthropic in production
    this.useOllama = this.configService.get<string>('NODE_ENV') === 'development';

    if (this.useOllama) {
      this.logger.log('Using Ollama for code review');
      this.ollamaClient = new Ollama();
      this.model = 'deepseek-coder'; // Using existing model
    } else {
      this.logger.log('Using Anthropic Claude for code review');
      this.anthropicClient = new Anthropic({
        apiKey: this.configService.get<string>('anthropic.apiKey'),
      });
      this.model = this.configService.get<string>('anthropic.model') || 'claude-sonnet-4-20250514';
    }
  }

  async reviewCode(
    prTitle: string,
    prDescription: string,
    files: { filename: string; patch?: string; additions: number; deletions: number }[],
  ): Promise<ReviewResult> {
    const startTime = Date.now();

    // Parse and chunk the diff
    const chunks = this.diffParser.parseAndChunk(
      files.map((f) => ({
        filename: f.filename,
        patch: f.patch || '',
        additions: f.additions,
        deletions: f.deletions,
      })),
    );

    if (chunks.length === 0) {
      return {
        issues: [],
        summary: {
          totalIssues: 0,
          critical: 0,
          warnings: 0,
          infos: 0,
          overallAssessment: 'No reviewable code changes found.',
        },
        metrics: {
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          costUsd: 0,
          processingTimeMs: Date.now() - startTime,
        },
      };
    }

    const allIssues: ReviewIssue[] = [];
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    // Process each chunk
    for (const chunk of chunks) {
      const hasReactFiles = chunk.files.some((f) =>
        this.diffParser.isReactFile(f.filename),
      );

      const diffContent = this.diffParser.formatDiffForPrompt(chunk.files);

      const result = await this.callClaude(
        prTitle,
        prDescription,
        chunk.files.length,
        diffContent,
        hasReactFiles,
      );

      if (result.response) {
        allIssues.push(...result.response.reviews);
      }

      totalInputTokens += result.inputTokens;
      totalOutputTokens += result.outputTokens;
    }

    // Deduplicate issues (same file + line + category)
    const uniqueIssues = this.deduplicateIssues(allIssues);

    // Calculate summary
    const summary = {
      totalIssues: uniqueIssues.length,
      critical: uniqueIssues.filter((i) => i.severity === 'error').length,
      warnings: uniqueIssues.filter((i) => i.severity === 'warning').length,
      infos: uniqueIssues.filter((i) => i.severity === 'info').length,
      overallAssessment: this.generateOverallAssessment(uniqueIssues),
    };

    // Calculate cost
    const costUsd = this.useOllama
      ? 0 // Ollama is free
      : (totalInputTokens / 1_000_000) * this.INPUT_COST_PER_MILLION +
        (totalOutputTokens / 1_000_000) * this.OUTPUT_COST_PER_MILLION;

    return {
      issues: uniqueIssues,
      summary,
      metrics: {
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        totalTokens: totalInputTokens + totalOutputTokens,
        costUsd: Math.round(costUsd * 10000) / 10000, // Round to 4 decimal places
        processingTimeMs: Date.now() - startTime,
      },
    };
  }

  private async callClaude(
    prTitle: string,
    prDescription: string,
    fileCount: number,
    diffContent: string,
    hasReactFiles: boolean,
  ): Promise<{
    response: AIReviewResponse | null;
    inputTokens: number;
    outputTokens: number;
  }> {
    const systemPrompt = this.promptBuilder.buildSystemPrompt();
    const userPrompt = this.promptBuilder.buildUserPrompt(
      prTitle,
      prDescription,
      fileCount,
      diffContent,
      hasReactFiles,
    );

    if (this.useOllama) {
      return this.callOllama(systemPrompt, userPrompt);
    } else {
      return this.callAnthropic(systemPrompt, userPrompt);
    }
  }

  private async callOllama(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<{
    response: AIReviewResponse | null;
    inputTokens: number;
    outputTokens: number;
  }> {
    try {
      this.logger.log('Calling Ollama with deepseek-coder model');

      const response = await this.ollamaClient.chat({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        options: {
          temperature: 0.1,
          num_predict: 2048
        }
      });

      const responseText = response.message.content;
      const parsed = this.promptBuilder.parseAIResponse(responseText);

      // Ollama doesn't provide token counts, so we'll estimate
      const inputTokens = systemPrompt.length + userPrompt.length;
      const outputTokens = responseText.length;

      return {
        response: parsed,
        inputTokens: inputTokens,
        outputTokens: outputTokens,
      };
    } catch (error) {
      this.logger.error('Ollama API error:', error);
      return {
        response: null,
        inputTokens: 0,
        outputTokens: 0,
      };
    }
  }

  private async callAnthropic(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<{
    response: AIReviewResponse | null;
    inputTokens: number;
    outputTokens: number;
  }> {
    try {
      const message = await this.anthropicClient.messages.create({
        model: this.model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const textContent = message.content.find((c: any) => c.type === 'text');
      const responseText = textContent?.type === 'text' ? textContent.text : '';

      const parsed = this.promptBuilder.parseAIResponse(responseText);

      return {
        response: parsed,
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
      };
    } catch (error) {
      this.logger.error('Claude API error:', error);
      return {
        response: null,
        inputTokens: 0,
        outputTokens: 0,
      };
    }
  }

  private deduplicateIssues(issues: ReviewIssue[]): ReviewIssue[] {
    const seen = new Set<string>();
    return issues.filter((issue) => {
      const key = `${issue.file}:${issue.line}:${issue.category}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private generateOverallAssessment(issues: ReviewIssue[]): string {
    if (issues.length === 0) {
      return 'No issues found. The code changes look good!';
    }

    const critical = issues.filter((i) => i.severity === 'error').length;
    const warnings = issues.filter((i) => i.severity === 'warning').length;

    if (critical > 0) {
      return `Found ${critical} critical issue(s) that should be addressed before merging. Please review the security and error-severity items.`;
    }

    if (warnings > 5) {
      return `Found ${warnings} warnings across the changes. Consider addressing the performance and readability concerns.`;
    }

    return `Found ${issues.length} suggestion(s) for improvement. Overall the code is in good shape with minor improvements possible.`;
  }
}
