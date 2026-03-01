import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReviewDocument = Review & Document;

export enum ReviewStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Schema({ timestamps: true })
export class Review {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Repository', required: true })
  repositoryId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Installation', required: true })
  installationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Organization' })
  organizationId: Types.ObjectId;

  @Prop({ required: true })
  prNumber: number;

  @Prop({ required: true })
  prTitle: string;

  @Prop({ required: true })
  prAuthor: string;

  @Prop({ required: true })
  prUrl: string;

  @Prop({ required: true })
  commitSha: string;

  @Prop({ type: String, enum: ReviewStatus, default: ReviewStatus.PENDING })
  status: ReviewStatus;

  @Prop()
  jobId: string;

  @Prop({ type: Object })
  summary: {
    totalIssues: number;
    critical: number;
    warnings: number;
    infos: number;
    overallAssessment: string;
  };

  @Prop({ type: Object })
  metrics: {
    filesReviewed: number;
    linesAnalyzed: number;
    processingTimeMs: number;
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
  };

  @Prop()
  errorMessage: string;

  @Prop()
  startedAt: Date;

  @Prop()
  completedAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

ReviewSchema.index({ repositoryId: 1, prNumber: 1 });
ReviewSchema.index({ organizationId: 1 });
ReviewSchema.index({ status: 1, createdAt: -1 });
ReviewSchema.index({ createdAt: -1 });
