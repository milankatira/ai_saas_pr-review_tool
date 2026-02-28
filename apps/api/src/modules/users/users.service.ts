import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

export interface CreateUserDto {
  githubId: string;
  username: string;
  email: string;
  avatarUrl?: string;
  accessToken?: string;
}

export interface UpdateUserDto {
  email?: string;
  avatarUrl?: string;
  accessToken?: string;
  organizationId?: Types.ObjectId;
  onboardingCompleted?: boolean;
}

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const user = new this.userModel(createUserDto);
    return user.save();
  }

  async findById(id: string | Types.ObjectId): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findByGithubId(githubId: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ githubId }).exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async update(
    id: string | Types.ObjectId,
    updateUserDto: UpdateUserDto,
  ): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async upsertByGithubId(
    githubId: string,
    data: CreateUserDto,
  ): Promise<UserDocument> {
    return this.userModel
      .findOneAndUpdate({ githubId }, data, { upsert: true, new: true })
      .exec() as Promise<UserDocument>;
  }

  async delete(id: string | Types.ObjectId): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('User not found');
    }
  }

  async completeOnboarding(id: string | Types.ObjectId): Promise<UserDocument> {
    return this.update(id, { onboardingCompleted: true });
  }
}
