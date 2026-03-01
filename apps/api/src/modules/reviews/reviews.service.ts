import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument, ReviewStatus } from './schemas/review.schema';
import {
  ReviewComment,
  ReviewCommentDocument,
} from './schemas/review-comment.schema';
import { ReviewIssue } from '../ai-review/prompt-builder.service';

export interface CreateReviewDto {
  userId?: Types.ObjectId;
  repositoryId: Types.ObjectId;
  installationId: Types.ObjectId;
  organizationId?: Types.ObjectId;
  prNumber: number;
  prTitle: string;
  prAuthor: string;
  prUrl: string;
  commitSha: string;
}

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(ReviewComment.name)
    private commentModel: Model<ReviewCommentDocument>,
  ) {}

  async create(dto: CreateReviewDto): Promise<ReviewDocument> {
    const review = new this.reviewModel({
      ...dto,
      status: ReviewStatus.PENDING,
    });
    return review.save();
  }

  async findById(id: string | Types.ObjectId): Promise<ReviewDocument | null> {
    return this.reviewModel.findById(id).exec();
  }

  async findByPR(
    repositoryId: Types.ObjectId,
    prNumber: number,
  ): Promise<ReviewDocument | null> {
    return this.reviewModel
      .findOne({ repositoryId, prNumber })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByRepository(
    repositoryId: Types.ObjectId,
    options: { limit?: number; skip?: number; status?: ReviewStatus } = {},
  ): Promise<{ reviews: ReviewDocument[]; total: number }> {
    const query: Record<string, unknown> = { repositoryId };
    if (options.status) {
      query.status = options.status;
    }

    const [reviews, total] = await Promise.all([
      this.reviewModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(options.skip || 0)
        .limit(options.limit || 20)
        .exec(),
      this.reviewModel.countDocuments(query).exec(),
    ]);

    return { reviews, total };
  }

  async findByOrganization(
    organizationId: Types.ObjectId,
    options: { limit?: number; skip?: number; status?: ReviewStatus } = {},
  ): Promise<{ reviews: ReviewDocument[]; total: number }> {
    const query: Record<string, unknown> = { organizationId };
    if (options.status) {
      query.status = options.status;
    }

    const [reviews, total] = await Promise.all([
      this.reviewModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(options.skip || 0)
        .limit(options.limit || 20)
        .populate('repositoryId')
        .exec(),
      this.reviewModel.countDocuments(query).exec(),
    ]);

    return { reviews, total };
  }

  async findByUser(
    userId: Types.ObjectId,
    options: { limit?: number; skip?: number; status?: ReviewStatus } = {},
  ): Promise<{ reviews: ReviewDocument[]; total: number }> {
    const query: Record<string, unknown> = { userId };
    if (options.status) {
      query.status = options.status;
    }

    const [reviews, total] = await Promise.all([
      this.reviewModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(options.skip || 0)
        .limit(options.limit || 20)
        .populate('repositoryId')
        .exec(),
      this.reviewModel.countDocuments(query).exec(),
    ]);

    return { reviews, total };
  }

  async findAllForUser(
    organizationIds: Types.ObjectId[],
    options: { limit?: number; skip?: number; status?: ReviewStatus } = {},
  ): Promise<{ reviews: ReviewDocument[]; total: number }> {
    const query: Record<string, unknown> = { 
      organizationId: { $in: organizationIds }
    };
    if (options.status) {
      query.status = options.status;
    }

    const [reviews, total] = await Promise.all([
      this.reviewModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(options.skip || 0)
        .limit(options.limit || 20)
        .populate('repositoryId')
        .exec(),
      this.reviewModel.countDocuments(query).exec(),
    ]);

    return { reviews, total };
  }

  async updateStatus(
    id: Types.ObjectId,
    status: ReviewStatus,
    errorMessage?: string,
  ): Promise<ReviewDocument> {
    const update: Record<string, unknown> = { status };

    if (status === ReviewStatus.PROCESSING) {
      update.startedAt = new Date();
    } else if (
      status === ReviewStatus.COMPLETED ||
      status === ReviewStatus.FAILED
    ) {
      update.completedAt = new Date();
    }

    if (errorMessage) {
      update.errorMessage = errorMessage;
    }

    const review = await this.reviewModel
      .findByIdAndUpdate(id, update, { new: true })
      .exec();

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return review;
  }

  async recordCompletion(
    id: Types.ObjectId,
    summary: Review['summary'],
    metrics: Review['metrics'],
  ): Promise<ReviewDocument> {
    const review = await this.reviewModel
      .findByIdAndUpdate(
        id,
        {
          status: ReviewStatus.COMPLETED,
          completedAt: new Date(),
          summary,
          metrics,
        },
        { new: true },
      )
      .exec();

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return review;
  }

  async saveComments(
    reviewId: Types.ObjectId,
    issues: ReviewIssue[],
  ): Promise<void> {
    const comments = issues.map((issue) => ({
      reviewId,
      filePath: issue.file,
      line: issue.line,
      endLine: issue.endLine,
      category: issue.category,
      severity: issue.severity,
      title: issue.title,
      description: issue.description,
      suggestion: issue.suggestion,
    }));

    await this.commentModel.insertMany(comments);
  }

  async getComments(reviewId: Types.ObjectId): Promise<ReviewCommentDocument[]> {
    return this.commentModel.find({ reviewId }).exec();
  }

  async getStats(organizationId?: Types.ObjectId): Promise<{
    total: number;
    completed: number;
    failed: number;
    processing: number;
    avgProcessingTime: number;
    totalCost: number;
  }> {
    const match: Record<string, unknown> = {};
    if (organizationId) {
      match.organizationId = organizationId;
    }

    const [counts, avgStats] = await Promise.all([
      this.reviewModel.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      this.reviewModel.aggregate([
        { $match: { ...match, status: ReviewStatus.COMPLETED } },
        {
          $group: {
            _id: null,
            avgProcessingTime: { $avg: '$metrics.processingTimeMs' },
            totalCost: { $sum: '$metrics.costUsd' },
          },
        },
      ]),
    ]);

    const statusCounts: Record<string, number> = {};
    for (const item of counts) {
      statusCounts[item._id as string] = item.count as number;
    }

    const totalCount = Object.values(statusCounts).reduce((a, b) => a + b, 0);

    return {
      total: totalCount,
      completed: statusCounts[ReviewStatus.COMPLETED] || 0,
      failed: statusCounts[ReviewStatus.FAILED] || 0,
      processing: statusCounts[ReviewStatus.PROCESSING] || 0,
      avgProcessingTime: avgStats[0]?.avgProcessingTime || 0,
      totalCost: avgStats[0]?.totalCost || 0,
    };
  }
}
