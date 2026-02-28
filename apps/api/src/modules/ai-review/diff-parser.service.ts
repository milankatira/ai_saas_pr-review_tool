import { Injectable } from '@nestjs/common';

interface FileDiff {
  filename: string;
  patch: string;
  additions: number;
  deletions: number;
}

interface DiffChunk {
  files: FileDiff[];
  totalTokens: number;
}

@Injectable()
export class DiffParserService {
  private readonly CHARS_PER_TOKEN = 2.5; // Conservative estimate
  private readonly MAX_TOKENS_PER_CHUNK = 50000;
  private readonly EXCLUDED_PATTERNS = [
    /package-lock\.json$/,
    /yarn\.lock$/,
    /pnpm-lock\.yaml$/,
    /\.min\.js$/,
    /\.min\.css$/,
    /dist\//,
    /build\//,
    /node_modules\//,
    /\.map$/,
    /\.d\.ts$/,
  ];

  parseAndChunk(files: FileDiff[]): DiffChunk[] {
    // Filter out excluded files
    const filteredFiles = files.filter((f) => {
      return !this.EXCLUDED_PATTERNS.some((pattern) =>
        pattern.test(f.filename),
      );
    });

    // Filter files without patches (binary files, etc.)
    const patchedFiles = filteredFiles.filter((f) => f.patch);

    // Calculate tokens for each file
    const filesWithTokens = patchedFiles.map((f) => ({
      ...f,
      tokens: this.estimateTokens(f.patch || ''),
    }));

    // Sort by token count (process larger files first)
    filesWithTokens.sort((a, b) => b.tokens - a.tokens);

    const chunks: DiffChunk[] = [];
    let currentChunk: FileDiff[] = [];
    let currentTokens = 0;

    for (const file of filesWithTokens) {
      // If single file exceeds limit, put it in its own chunk
      if (file.tokens > this.MAX_TOKENS_PER_CHUNK) {
        if (currentChunk.length > 0) {
          chunks.push({ files: currentChunk, totalTokens: currentTokens });
          currentChunk = [];
          currentTokens = 0;
        }
        // Truncate the patch if necessary
        const truncatedFile = {
          ...file,
          patch: this.truncatePatch(file.patch || '', this.MAX_TOKENS_PER_CHUNK),
        };
        chunks.push({
          files: [truncatedFile],
          totalTokens: this.MAX_TOKENS_PER_CHUNK,
        });
        continue;
      }

      // Check if adding this file would exceed the limit
      if (currentTokens + file.tokens > this.MAX_TOKENS_PER_CHUNK) {
        if (currentChunk.length > 0) {
          chunks.push({ files: currentChunk, totalTokens: currentTokens });
        }
        currentChunk = [file];
        currentTokens = file.tokens;
      } else {
        currentChunk.push(file);
        currentTokens += file.tokens;
      }
    }

    // Add remaining files
    if (currentChunk.length > 0) {
      chunks.push({ files: currentChunk, totalTokens: currentTokens });
    }

    return chunks;
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / this.CHARS_PER_TOKEN);
  }

  private truncatePatch(patch: string, maxTokens: number): string {
    const maxChars = maxTokens * this.CHARS_PER_TOKEN;
    if (patch.length <= maxChars) return patch;

    return (
      patch.substring(0, maxChars) +
      '\n\n... [truncated due to size]'
    );
  }

  formatDiffForPrompt(files: FileDiff[]): string {
    return files
      .map((f) => {
        return `### File: ${f.filename}\n\`\`\`diff\n${f.patch}\n\`\`\``;
      })
      .join('\n\n');
  }

  getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1] : '';
  }

  isReactFile(filename: string): boolean {
    const ext = this.getFileExtension(filename);
    return ['tsx', 'jsx'].includes(ext);
  }

  isTypeScriptFile(filename: string): boolean {
    const ext = this.getFileExtension(filename);
    return ['ts', 'tsx'].includes(ext);
  }
}
