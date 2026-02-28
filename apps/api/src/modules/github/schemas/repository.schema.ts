import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RepositoryDocument = Repository & Document;

@Schema({ timestamps: true })
export class Repository {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Installation', required: true })
  installationId: Types.ObjectId;

  @Prop({ required: true })
  githubRepoId: number;

  @Prop({ required: true })
  fullName: string; // e.g., "owner/repo"

  @Prop({ required: true })
  name: string;

  @Prop({ default: false })
  private: boolean;

  @Prop({ default: 'main' })
  defaultBranch: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Object, default: {} })
  settings: {
    severityThreshold?: 'error' | 'warning' | 'info';
    enabledCategories?: string[];
    excludePatterns?: string[];
  };

  createdAt: Date;
  updatedAt: Date;
}

export const RepositorySchema = SchemaFactory.createForClass(Repository);

RepositorySchema.index({ installationId: 1, githubRepoId: 1 }, { unique: true });
RepositorySchema.index({ fullName: 1 });
