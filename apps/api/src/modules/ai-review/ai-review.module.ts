import { Module, forwardRef } from '@nestjs/common';
import { AiReviewService } from './ai-review.service';
import { PromptBuilderService } from './prompt-builder.service';
import { DiffParserService } from './diff-parser.service';
import { CommentPosterService } from './comment-poster.service';
import { GithubModule } from '../github/github.module';

@Module({
  imports: [forwardRef(() => GithubModule)],
  providers: [
    AiReviewService,
    PromptBuilderService,
    DiffParserService,
    CommentPosterService,
  ],
  exports: [AiReviewService, CommentPosterService, DiffParserService],
})
export class AiReviewModule {}
