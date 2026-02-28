import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ReviewStatus } from './schemas/review.schema';

@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  async findAll(
    @Query('organizationId') organizationId?: string,
    @Query('repositoryId') repositoryId?: string,
    @Query('status') status?: ReviewStatus,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
  ) {
    const options = {
      limit: limit ? parseInt(limit, 10) : 20,
      skip: skip ? parseInt(skip, 10) : 0,
      status,
    };

    if (repositoryId) {
      return this.reviewsService.findByRepository(
        new Types.ObjectId(repositoryId),
        options,
      );
    }

    if (organizationId) {
      return this.reviewsService.findByOrganization(
        new Types.ObjectId(organizationId),
        options,
      );
    }

    return { reviews: [], total: 0 };
  }

  @Get('stats')
  async getStats(@Query('organizationId') organizationId?: string) {
    return this.reviewsService.getStats(
      organizationId ? new Types.ObjectId(organizationId) : undefined,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const review = await this.reviewsService.findById(id);
    if (!review) {
      return null;
    }

    const comments = await this.reviewsService.getComments(review._id);
    return { review, comments };
  }

  @Get(':id/comments')
  async getComments(@Param('id') id: string) {
    return this.reviewsService.getComments(new Types.ObjectId(id));
  }

  @Post(':id/retry')
  async retry(@Param('id') id: string) {
    // This would re-queue the review job
    // For now, just reset status to pending
    return this.reviewsService.updateStatus(
      new Types.ObjectId(id),
      ReviewStatus.PENDING,
    );
  }
}
