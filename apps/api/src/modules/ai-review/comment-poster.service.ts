import { Injectable, Logger } from '@nestjs/common';
import { GithubAppService, ReviewComment } from '../github/github-app.service';
import { ReviewIssue } from './prompt-builder.service';

@Injectable()
export class CommentPosterService {
  private readonly logger = new Logger(CommentPosterService.name);

  constructor(private githubAppService: GithubAppService) {}

  async postReviewComments(
    installationId: number,
    owner: string,
    repo: string,
    prNumber: number,
    issues: ReviewIssue[],
    summary: {
      totalIssues: number;
      critical: number;
      warnings: number;
      infos: number;
      overallAssessment: string;
    },
    metrics: {
      costUsd: number;
      processingTimeMs: number;
    },
  ): Promise<{ success: boolean; error?: string }> {
    // Format inline comments
    const inlineComments: ReviewComment[] = issues
      .filter((issue) => issue.line > 0)
      .map((issue) => {
        const isMultiLine = issue.endLine && issue.endLine > issue.line;
        return {
          path: issue.file,
          line: isMultiLine ? issue.endLine! : issue.line,
          start_line: isMultiLine ? issue.line : undefined,
          side: 'RIGHT',
          body: this.formatIssueComment(issue),
        };
      });

    // Build summary comment
    const summaryBody = this.formatSummaryComment(summary, issues, metrics);

    // Determine review event type
    const event = summary.critical > 0 ? 'REQUEST_CHANGES' : 'COMMENT';

    try {
      if (inlineComments.length > 0) {
        // Post review with inline comments
        await this.githubAppService.createReview(
          installationId,
          owner,
          repo,
          prNumber,
          summaryBody,
          inlineComments,
          event as 'COMMENT' | 'REQUEST_CHANGES' | 'APPROVE',
        );
      } else {
        // Just post summary comment
        await this.githubAppService.postComment(
          installationId,
          owner,
          repo,
          prNumber,
          summaryBody,
        );
      }

      this.logger.log(`Successfully posted review comments to ${owner}/${repo}#${prNumber}`);
      return { success: true };
    } catch (error: any) {
      // Handle permission errors gracefully
      if (error.status === 403 && error.message?.includes('Resource not accessible by integration')) {
        this.logger.warn(`GitHub permissions insufficient for ${owner}/${repo}#${prNumber}. Review results stored in database.`);
        return {
          success: false,
          error: 'GitHub permissions insufficient. Review completed and stored in database.'
        };
      }

      this.logger.error('Failed to post review comments:', error);
      return {
        success: false,
        error: error.message || 'Failed to post comments to GitHub'
      };
    }
  }

  private formatIssueComment(issue: ReviewIssue): string {
    const severityEmoji = this.getSeverityEmoji(issue.severity);
    const categoryBadge = this.getCategoryBadge(issue.category);

    let comment = `${severityEmoji} **${issue.title}** ${categoryBadge}\n\n`;
    comment += `${issue.description}\n`;

    if (issue.suggestion) {
      comment += `\n💡 **Suggestion:** ${issue.suggestion}`;
    }

    return comment;
  }

  private formatSummaryComment(
    summary: {
      totalIssues: number;
      critical: number;
      warnings: number;
      infos: number;
      overallAssessment: string;
    },
    issues: ReviewIssue[],
    metrics: { costUsd: number; processingTimeMs: number },
  ): string {
    let comment = `## 🤖 AI Code Review Summary\n\n`;
    comment += `**${summary.overallAssessment}**\n\n`;

    comment += `### 📊 Statistics\n\n`;
    comment += `| Metric | Count |\n`;
    comment += `|--------|-------|\n`;
    comment += `| Total Issues | ${summary.totalIssues} |\n`;
    comment += `| 🔴 Critical | ${summary.critical} |\n`;
    comment += `| 🟡 Warnings | ${summary.warnings} |\n`;
    comment += `| 🔵 Suggestions | ${summary.infos} |\n\n`;

    // Group issues by category
    const byCategory = this.groupByCategory(issues);

    if (Object.keys(byCategory).length > 0) {
      comment += `### 🎯 Breakdown by Category\n\n`;

      for (const [category, categoryIssues] of Object.entries(byCategory)) {
        comment += `**${this.formatCategoryName(category)}** (${categoryIssues.length})\n`;
        for (const issue of categoryIssues.slice(0, 3)) {
          comment += `- ${this.getSeverityEmoji(issue.severity)} ${issue.title}\n`;
        }
        if (categoryIssues.length > 3) {
          comment += `- _...and ${categoryIssues.length - 3} more_\n`;
        }
        comment += '\n';
      }
    }

    comment += `---\n`;
    comment += `_💰 Review cost: $${metrics.costUsd.toFixed(4)} | ⚡ Processed in ${(metrics.processingTimeMs / 1000).toFixed(1)}s | Powered by Claude_`;

    return comment;
  }

  private getSeverityEmoji(severity: string): string {
    switch (severity) {
      case 'error':
        return '🔴';
      case 'warning':
        return '🟡';
      case 'info':
        return '🔵';
      default:
        return '⚪';
    }
  }

  private getCategoryBadge(category: string): string {
    switch (category) {
      case 'correctness':
        return '`🐞 correctness`';
      case 'security':
        return '`🔒 security`';
      case 'performance':
        return '`⚡ performance`';
      case 'maintainability':
        return '`🛠️ maintainability`';
      case 'best_practice':
        return '`✨ best practice`';
      default:
        return `\`${category}\``;
    }
  }

  private formatCategoryName(category: string): string {
    switch (category) {
      case 'correctness':
        return '🐞 Correctness & Logic';
      case 'security':
        return '🔒 Security';
      case 'performance':
        return '⚡ Performance';
      case 'maintainability':
        return '🛠️ Maintainability';
      case 'best_practice':
        return '✨ Best Practices';
      default:
        return category;
    }
  }

  private groupByCategory(issues: ReviewIssue[]): Record<string, ReviewIssue[]> {
    return issues.reduce(
      (acc, issue) => {
        if (!acc[issue.category]) {
          acc[issue.category] = [];
        }
        acc[issue.category].push(issue);
        return acc;
      },
      {} as Record<string, ReviewIssue[]>,
    );
  }
}
