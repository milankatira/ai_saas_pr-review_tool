import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  Req,
  UseGuards,
  Query,
  RawBodyRequest,
} from '@nestjs/common';
import { Request } from 'express';
import { BillingService } from './billing.service';
import { SubscriptionService } from './subscription.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserDocument } from '../users/schemas/user.schema';

@Controller('billing')
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  async createCheckout(
    @CurrentUser() user: UserDocument,
    @Body('organizationId') organizationId: string,
    @Body('successUrl') successUrl: string,
    @Body('cancelUrl') cancelUrl: string,
  ) {
    return this.billingService.createCheckoutSession(
      organizationId,
      user._id.toString(),
      successUrl,
      cancelUrl,
    );
  }

  @Get('portal')
  @UseGuards(JwtAuthGuard)
  async getPortal(
    @Query('organizationId') organizationId: string,
    @Query('returnUrl') returnUrl: string,
  ) {
    return this.billingService.createPortalSession(organizationId, returnUrl);
  }

  @Get('subscription')
  @UseGuards(JwtAuthGuard)
  async getSubscription(@Query('organizationId') organizationId: string) {
    const subscription =
      await this.subscriptionService.getOrCreateFreeSubscription(organizationId);
    const usage = await this.subscriptionService.getUsageCount(organizationId);

    return {
      subscription,
      usage,
    };
  }

  @Post('subscription/cancel')
  @UseGuards(JwtAuthGuard)
  async cancelSubscription(
    @Body('organizationId') organizationId: string,
    @Body('immediate') immediate = false,
  ) {
    return this.subscriptionService.cancelSubscription(organizationId, immediate);
  }

  @Post('webhooks/stripe')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    if (!req.rawBody) {
      throw new Error('Raw body not available');
    }

    await this.billingService.handleWebhook(signature, req.rawBody);
    return { received: true };
  }
}
