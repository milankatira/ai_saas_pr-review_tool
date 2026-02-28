import { Injectable } from '@nestjs/common';

export interface ReviewIssue {
  file: string;
  line: number;
  endLine?: number;
  severity: 'error' | 'warning' | 'info';
  category: 'readability' | 'performance' | 'security' | 'react-antipattern';
  title: string;
  description: string;
  suggestion?: string;
}

export interface ReviewSummary {
  totalIssues: number;
  critical: number;
  warnings: number;
  infos: number;
  overallAssessment: string;
}

export interface AIReviewResponse {
  reviews: ReviewIssue[];
  summary: ReviewSummary;
}

@Injectable()
export class PromptBuilderService {
  buildSystemPrompt(): string {
    return `You are an expert senior code reviewer specializing in TypeScript, JavaScript, React, and Node.js applications. Your role is to analyze code changes and provide actionable, constructive feedback.

## Focus Areas

1. **Readability**
   - Naming conventions (variables, functions, components)
   - Code complexity and cognitive load
   - Function/component length
   - Clear logic flow and intent

2. **Performance**
   - React re-renders and memoization opportunities
   - Expensive computations in render cycles
   - N+1 query patterns
   - Unnecessary loops or iterations
   - Memory leaks

3. **Security**
   - XSS vulnerabilities
   - SQL/NoSQL injection risks
   - Hardcoded secrets or credentials
   - Insecure data handling
   - Missing input validation

4. **React Anti-patterns**
   - Missing or incorrect hook dependencies
   - Direct state mutation
   - Missing cleanup in useEffect
   - Prop drilling (suggest context/state management)
   - Missing keys in lists
   - Unnecessary re-renders

## Response Format

Return your analysis as valid JSON matching this exact schema:

\`\`\`json
{
  "reviews": [
    {
      "file": "string - relative file path",
      "line": "number - line number in the diff",
      "endLine": "number - optional end line for multi-line issues",
      "severity": "error | warning | info",
      "category": "readability | performance | security | react-antipattern",
      "title": "string - concise issue title (max 60 chars)",
      "description": "string - detailed explanation (max 200 chars)",
      "suggestion": "string - optional fix suggestion (max 150 chars)"
    }
  ],
  "summary": {
    "totalIssues": "number",
    "critical": "number - count of 'error' severity",
    "warnings": "number - count of 'warning' severity",
    "infos": "number - count of 'info' severity",
    "overallAssessment": "string - brief overall assessment (max 300 chars)"
  }
}
\`\`\`

## Rules

- Only flag genuine issues that impact code quality, not minor stylistic preferences
- Be specific about line numbers from the diff
- Provide actionable suggestions when possible
- Severity guide:
  - \`error\`: Security vulnerabilities, bugs, critical issues that must be fixed
  - \`warning\`: Performance issues, anti-patterns, should be addressed
  - \`info\`: Suggestions for improvement, nice-to-have changes
- Return ONLY valid JSON, no explanatory text outside the JSON structure
- If no issues are found, return an empty reviews array with appropriate summary`;
  }

  buildUserPrompt(
    prTitle: string,
    prDescription: string,
    fileCount: number,
    diffContent: string,
    hasReactFiles: boolean,
  ): string {
    let prompt = `## Pull Request Review Request

**Title:** ${prTitle}
**Description:** ${prDescription || 'No description provided'}
**Files Changed:** ${fileCount}

## Code Changes

${diffContent}

## Instructions

Analyze the above code changes and return structured JSON feedback following the schema in your instructions.`;

    if (hasReactFiles) {
      prompt += `

**Note:** This PR contains React components. Pay extra attention to:
- Hook dependency arrays
- Memoization opportunities (useMemo, useCallback, React.memo)
- Effect cleanup functions
- State management patterns`;
    }

    return prompt;
  }

  parseAIResponse(response: string): AIReviewResponse | null {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return null;
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate structure
      if (!Array.isArray(parsed.reviews) || !parsed.summary) {
        return null;
      }

      return parsed as AIReviewResponse;
    } catch {
      return null;
    }
  }
}
