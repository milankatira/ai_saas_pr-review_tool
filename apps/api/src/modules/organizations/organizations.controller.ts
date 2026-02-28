import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserDocument } from '../users/schemas/user.schema';
import { MemberRole } from './schemas/member.schema';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private readonly orgsService: OrganizationsService) {}

  @Post()
  async create(
    @CurrentUser() user: UserDocument,
    @Body('name') name: string,
  ) {
    return this.orgsService.create(user._id, name);
  }

  @Get()
  async findAll(@CurrentUser() user: UserDocument) {
    return this.orgsService.findByUser(user._id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.orgsService.findById(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updates: { name?: string; settings?: Record<string, unknown> },
  ) {
    return this.orgsService.update(new Types.ObjectId(id), updates);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.orgsService.delete(new Types.ObjectId(id));
    return { message: 'Organization deleted' };
  }

  @Get(':id/members')
  async getMembers(@Param('id') id: string) {
    return this.orgsService.getMembers(new Types.ObjectId(id));
  }

  @Post(':id/members')
  async addMember(
    @Param('id') id: string,
    @Body() body: { userId: string; role?: MemberRole },
  ) {
    return this.orgsService.addMember(
      new Types.ObjectId(id),
      new Types.ObjectId(body.userId),
      body.role,
    );
  }

  @Patch(':id/members/:userId')
  async updateMemberRole(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body('role') role: MemberRole,
  ) {
    return this.orgsService.updateMemberRole(
      new Types.ObjectId(id),
      new Types.ObjectId(userId),
      role,
    );
  }

  @Delete(':id/members/:userId')
  async removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    await this.orgsService.removeMember(
      new Types.ObjectId(id),
      new Types.ObjectId(userId),
    );
    return { message: 'Member removed' };
  }
}
