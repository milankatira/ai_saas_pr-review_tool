import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { UsersService, UpdateUserDto } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserDocument } from './schemas/user.schema';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@CurrentUser() user: UserDocument) {
    const userData = await this.usersService.findById(user._id);
    if (!userData) {
      return null;
    }
    // Remove sensitive fields
    const { accessToken, ...safeUser } = userData.toObject();
    return safeUser;
  }

  @Patch('me')
  async updateMe(
    @CurrentUser() user: UserDocument,
    @Body() updateUserDto: Partial<UpdateUserDto>,
  ) {
    // Only allow updating certain fields
    const allowedUpdates: UpdateUserDto = {};
    if (updateUserDto.email) allowedUpdates.email = updateUserDto.email;

    const updated = await this.usersService.update(user._id, allowedUpdates);
    const { accessToken, ...safeUser } = updated.toObject();
    return safeUser;
  }
}
