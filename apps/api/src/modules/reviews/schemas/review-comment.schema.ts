import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReviewCommentDocument = ReviewComment & Document;

@Schema({ timestamps: true })
export class ReviewComment {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Review', required: true })
  reviewId: Types.ObjectId;

  @Prop()
  githubCommentId: number;

  @Prop({ required: true })
  filePath: string;

  @Prop({ required: true })
  line: number;

  @Prop()
  endLine: number;

  @Prop({
    required: true,
    enum: ['correctness', 'security', 'performance', 'maintainability', 'best_practice'],
  })
  category: string;

  @Prop({ required: true, enum: ['error', 'warning', 'info'] })
  severity: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop()
  suggestion: string;

  @Prop()
  postedAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const ReviewCommentSchema = SchemaFactory.createForClass(ReviewComment);

ReviewCommentSchema.index({ reviewId: 1 });
ReviewCommentSchema.index({ category: 1 });
