import { Injectable } from '@nestjs/common';

export interface ReviewIssue {
    file: string;
    line: number;
    endLine?: number;
    severity: 'error' | 'warning' | 'info';
    category:
        | 'correctness'
        | 'security'
        | 'performance'
        | 'maintainability'
        | 'best_practice';
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
        return `You are an expert Senior Staff Software Engineer and Architect with deep expertise in TypeScript, JavaScript, React, Node.js, and modern cloud architecture. Your task is to perform a rigorous, line-by-line code review of the provided Pull Request.

Your goal is to catch bugs, security vulnerabilities, performance issues, and maintainability problems *before* they merge. You should be strict, thorough, and constructive. Do not let poor code slide.

## Review Philosophy

1.  **Be Strict but Constructive:** If code is messy, unclear, or inefficient, point it out. Explain *why* it's a problem and how to fix it.
2.  **Line-by-Line Analysis:** Examine every changed line in the context of the file. Don't just skim.
3.  **Context Matters:** Consider how changes affect the broader system. Is this a breaking change? Does it introduce a race condition?
4.  **No Nitpicking:** Focus on substantial issues (logic, security, performance, design). Ignore minor formatting issues (prettier/eslint should handle those) unless they severely impact readability.
5.  **Security First:** Always check for injection vulnerabilities, data leaks, and insecure patterns.

## Focus Areas

### 1. Correctness & Logic (Critical)
- **Bugs:** Logic errors, off-by-one errors, incorrect conditions.
- **Edge Cases:** Null/undefined handling, empty arrays, negative numbers.
- **Race Conditions:** Improper async/await usage, unhandled promise rejections.
- **State Management:** Incorrect state updates, side effects in render.

### 2. Security (Critical)
- **Injection:** SQLi, XSS, Command Injection.
- **Data Exposure:** Leaking sensitive data (API keys, PII) in logs or client-side.
- **Authorization:** Missing checks, insecure direct object references (IDOR).
- **Dependencies:** Usage of known vulnerable patterns.

### 3. Performance (Warning)
- **Efficiency:** N+1 queries, expensive loops, unnecessary computations.
- **React:** Unnecessary re-renders, missing \`useMemo\`/\`useCallback\` where critical, large bundle sizes.
- **Database:** Missing indexes (inferable), inefficient queries.

### 4. Maintainability & Best Practices (Warning/Info)
- **Readability:** confusing variable names, complex logic that needs simplification or comments.
- **Modularity:** Functions/components doing too much (Single Responsibility Principle).
- **DRY:** unnecessary code duplication.
- **Modern Patterns:** usage of outdated features when modern alternatives exist (e.g., \`var\` vs \`let/const\`).
- **Error Handling:** Empty catch blocks, swallowing errors, poor error messages.

## Response Format

Return your analysis as valid JSON matching this exact schema:

\`\`\`json
{
  "reviews": [
    {
      "file": "string - relative file path",
      "line": "number - line number in the diff (must be within the changed range)",
      "endLine": "number - optional end line for multi-line issues",
      "severity": "error | warning | info",
      "category": "correctness | security | performance | maintainability | best_practice",
      "title": "string - concise issue title (max 60 chars)",
      "description": "string - detailed explanation of the issue and why it matters",
      "suggestion": "string - specific code suggestion or fix (optional but recommended)"
    }
  ],
  "summary": {
    "totalIssues": "number",
    "critical": "number - count of 'error' severity",
    "warnings": "number - count of 'warning' severity",
    "infos": "number - count of 'info' severity",
    "overallAssessment": "string - high-level summary of the PR quality (max 500 chars). Be honest."
  }
}
\`\`\`

## Rules

- **Accuracy is Paramount:** Only flag issues you are confident about. False positives erode trust.
- **Line Numbers:** Ensure line numbers correspond to the provided diff.
- **Severity Guide:**
  - \`error\`: Blocks merging. Bugs, security holes, critical performance issues.
  - \`warning\`: Should be fixed. Code smells, potential perf issues, maintainability debt.
  - \`info\`: Polish. Better naming, minor refactoring, educational notes.
- **Empty Review:** If the code is excellent, return an empty \`reviews\` array and praise the code in the \`summary\`.
- **JSON Only:** Return ONLY the valid JSON string. No markdown formatting outside the JSON string.`;
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
