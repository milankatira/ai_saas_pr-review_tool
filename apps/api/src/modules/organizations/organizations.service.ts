import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Organization, OrganizationDocument } from './schemas/organization.schema';
import { Member, MemberDocument, MemberRole } from './schemas/member.schema';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectModel(Organization.name) private orgModel: Model<OrganizationDocument>,
    @InjectModel(Member.name) private memberModel: Model<MemberDocument>,
  ) {}

  async create(
    ownerId: Types.ObjectId,
    name: string,
  ): Promise<OrganizationDocument> {
    const slug = this.generateSlug(name);

    const existing = await this.orgModel.findOne({ slug }).exec();
    if (existing) {
      throw new ConflictException('Organization with this name already exists');
    }

    const org = new this.orgModel({ name, slug, ownerId });
    const savedOrg = await org.save();

    // Add owner as member
    await this.addMember(savedOrg._id, ownerId, MemberRole.OWNER);

    return savedOrg;
  }

  async findById(id: string | Types.ObjectId): Promise<OrganizationDocument | null> {
    return this.orgModel.findById(id).exec();
  }

  async findBySlug(slug: string): Promise<OrganizationDocument | null> {
    return this.orgModel.findOne({ slug }).exec();
  }

  async findByUser(userId: Types.ObjectId): Promise<OrganizationDocument[]> {
    const memberships = await this.memberModel.find({ userId }).exec();
    const orgIds = memberships.map((m) => m.organizationId);
    return this.orgModel.find({ _id: { $in: orgIds } }).exec();
  }

  async update(
    id: Types.ObjectId,
    updates: Partial<{ name: string; settings: Organization['settings'] }>,
  ): Promise<OrganizationDocument> {
    const org = await this.orgModel
      .findByIdAndUpdate(id, updates, { new: true })
      .exec();

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    return org;
  }

  async delete(id: Types.ObjectId): Promise<void> {
    await this.memberModel.deleteMany({ organizationId: id }).exec();
    await this.orgModel.findByIdAndDelete(id).exec();
  }

  async addMember(
    orgId: Types.ObjectId,
    userId: Types.ObjectId,
    role: MemberRole = MemberRole.MEMBER,
  ): Promise<MemberDocument> {
    const existing = await this.memberModel
      .findOne({ organizationId: orgId, userId })
      .exec();

    if (existing) {
      throw new ConflictException('User is already a member');
    }

    const member = new this.memberModel({
      organizationId: orgId,
      userId,
      role,
      joinedAt: new Date(),
    });

    return member.save();
  }

  async removeMember(orgId: Types.ObjectId, userId: Types.ObjectId): Promise<void> {
    await this.memberModel
      .findOneAndDelete({ organizationId: orgId, userId })
      .exec();
  }

  async updateMemberRole(
    orgId: Types.ObjectId,
    userId: Types.ObjectId,
    role: MemberRole,
  ): Promise<MemberDocument> {
    const member = await this.memberModel
      .findOneAndUpdate(
        { organizationId: orgId, userId },
        { role },
        { new: true },
      )
      .exec();

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    return member;
  }

  async getMembers(orgId: Types.ObjectId): Promise<MemberDocument[]> {
    return this.memberModel.find({ organizationId: orgId }).populate('userId').exec();
  }

  async isMember(orgId: Types.ObjectId, userId: Types.ObjectId): Promise<boolean> {
    const member = await this.memberModel
      .findOne({ organizationId: orgId, userId })
      .exec();
    return !!member;
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
