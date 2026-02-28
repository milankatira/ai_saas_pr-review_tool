import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InstallationDocument = Installation & Document;

@Schema({ timestamps: true })
export class Installation {
  _id: Types.ObjectId;

  @Prop({ required: true, unique: true })
  installationId: number;

  @Prop({ required: true })
  accountLogin: string;

  @Prop({ required: true, enum: ['User', 'Organization'] })
  accountType: 'User' | 'Organization';

  @Prop({ required: true })
  accountId: number;

  @Prop({ type: Types.ObjectId, ref: 'Organization' })
  organizationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ type: Object, default: {} })
  permissions: Record<string, string>;

  @Prop({ enum: ['all', 'selected'], default: 'selected' })
  repositorySelection: 'all' | 'selected';

  @Prop()
  suspendedAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const InstallationSchema = SchemaFactory.createForClass(Installation);

InstallationSchema.index({ installationId: 1 }, { unique: true });
InstallationSchema.index({ organizationId: 1 });
InstallationSchema.index({ userId: 1 });
