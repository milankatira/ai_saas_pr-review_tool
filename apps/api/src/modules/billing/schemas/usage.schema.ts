import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UsageDocument = Usage & Document;

@Schema({ timestamps: true })
export class Usage {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Subscription', required: true })
  subscriptionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Organization' })
  organizationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Review', required: true })
  reviewId: Types.ObjectId;

  @Prop({ required: true })
  periodStart: Date;

  @Prop({ required: true })
  periodEnd: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const UsageSchema = SchemaFactory.createForClass(Usage);

UsageSchema.index({ subscriptionId: 1, periodStart: 1, periodEnd: 1 });
UsageSchema.index({ organizationId: 1 });
