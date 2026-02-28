import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { SubscriptionService } from '../../modules/billing/subscription.service';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private subscriptionService: SubscriptionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const canPerform = await this.subscriptionService.canPerformReview(
      user.organizationId || user._id,
    );

    if (!canPerform) {
      throw new ForbiddenException(
        'Review limit reached. Please upgrade your plan.',
      );
    }

    return true;
  }
}
