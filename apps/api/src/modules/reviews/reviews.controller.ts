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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserDocument } from '../users/schemas/user.schema';

@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  async findAll(
    @CurrentUser() user: UserDocument,
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
      const result = await this.reviewsService.findByRepository(
        new Types.ObjectId(repositoryId),
        options,
      );
      return { data: result };
    }

    if (organizationId) {
      const result = await this.reviewsService.findByOrganization(
        new Types.ObjectId(organizationId),
        options,
      );
      return { data: result };
    }

    const result = await this.reviewsService.findByUser(user._id, options);
    return { data: result };
  }

  @Get('stats')
  async getStats(@Query('organizationId') organizationId?: string) {
    const stats = await this.reviewsService.getStats(
      organizationId ? new Types.ObjectId(organizationId) : undefined,
    );
    return { data: stats };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const review = await this.reviewsService.findById(id);
    if (!review) {
      return { data: null };
    }

    const comments = await this.reviewsService.getComments(review._id);
    return { data: { review, comments } };
  }

  @Get(':id/comments')
  async getComments(@Param('id') id: string) {
    const comments = await this.reviewsService.getComments(new Types.ObjectId(id));
    return { data: comments };
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
