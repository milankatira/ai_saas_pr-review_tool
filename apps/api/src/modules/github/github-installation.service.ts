import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Installation, InstallationDocument } from './schemas/installation.schema';
import { Repository, RepositoryDocument } from './schemas/repository.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class GithubInstallationService {
  constructor(
    @InjectModel(Installation.name)
    private installationModel: Model<InstallationDocument>,
    @InjectModel(Repository.name)
    private repositoryModel: Model<RepositoryDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  async handleInstallationCreated(payload: any): Promise<InstallationDocument> {
    const { installation, repositories } = payload;

    const installationDoc = await this.installationModel.findOneAndUpdate(
      { installationId: installation.id },
      {
        installationId: installation.id,
        accountLogin: installation.account.login,
        accountType: installation.account.type,
        accountId: installation.account.id,
        permissions: installation.permissions,
        repositorySelection: installation.repository_selection,
      },
      { upsert: true, new: true },
    );

    // Add repositories
    if (repositories) {
      await this.syncRepositories(installationDoc._id, repositories);
    }

    return installationDoc;
  }

  async handleInstallationDeleted(payload: any): Promise<void> {
    const { installation } = payload;

    const installationDoc = await this.installationModel.findOne({
      installationId: installation.id,
    });

    if (installationDoc) {
      await this.repositoryModel.deleteMany({
        installationId: installationDoc._id,
      });
      await this.installationModel.deleteOne({ _id: installationDoc._id });
    }
  }

  async handleRepositoriesAdded(payload: any): Promise<void> {
    const { installation, repositories_added } = payload;

    const installationDoc = await this.installationModel.findOne({
      installationId: installation.id,
    });

    if (installationDoc && repositories_added) {
      await this.syncRepositories(installationDoc._id, repositories_added);
    }
  }

  async handleRepositoriesRemoved(payload: any): Promise<void> {
    const { installation, repositories_removed } = payload;

    const installationDoc = await this.installationModel.findOne({
      installationId: installation.id,
    });

    if (installationDoc && repositories_removed) {
      const repoIds = repositories_removed.map((r: any) => r.id);
      await this.repositoryModel.deleteMany({
        installationId: installationDoc._id,
        githubRepoId: { $in: repoIds },
      });
    }
  }

  private async syncRepositories(
    installationId: Types.ObjectId,
    repositories: any[],
  ): Promise<void> {
    const ops = repositories.map((repo) => ({
      updateOne: {
        filter: {
          installationId,
          githubRepoId: repo.id,
        },
        update: {
          $set: {
            installationId,
            githubRepoId: repo.id,
            fullName: repo.full_name,
            name: repo.name,
            private: repo.private,
          },
        },
        upsert: true,
      },
    }));

    await this.repositoryModel.bulkWrite(ops);
  }

  async getInstallationByGithubId(
    installationId: number,
  ): Promise<InstallationDocument | null> {
    return this.installationModel.findOne({ installationId }).exec();
  }

  async getInstallationById(
    id: Types.ObjectId,
  ): Promise<InstallationDocument | null> {
    return this.installationModel.findById(id).exec();
  }

  async getRepositoryByGithubId(
    githubRepoId: number,
  ): Promise<RepositoryDocument | null> {
    return this.repositoryModel.findOne({ githubRepoId }).exec();
  }

  async getRepositoryById(id: Types.ObjectId): Promise<RepositoryDocument | null> {
    return this.repositoryModel.findById(id).exec();
  }

  async getRepositoriesByInstallation(
    installationId: Types.ObjectId,
  ): Promise<RepositoryDocument[]> {
    return this.repositoryModel.find({ installationId }).exec();
  }

  async getInstallationsByOrganization(
    organizationId: Types.ObjectId,
  ): Promise<InstallationDocument[]> {
    return this.installationModel.find({ organizationId }).exec();
  }

  async getRepositoriesByOrganization(
    organizationId: Types.ObjectId,
  ): Promise<RepositoryDocument[]> {
    const installations = await this.getInstallationsByOrganization(organizationId);
    const installationIds = installations.map((i) => i._id);
    return this.repositoryModel.find({ installationId: { $in: installationIds } }).exec();
  }

  async linkInstallationToOrg(
    installationId: number,
    organizationId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<InstallationDocument> {
    const installation = await this.installationModel.findOneAndUpdate(
      { installationId },
      { organizationId, userId },
      { new: true },
    );

    if (!installation) {
      throw new NotFoundException('Installation not found');
    }

    return installation;
  }

  async linkInstallationToUserOrg(
    installationId: number,
    githubUsername: string,
  ): Promise<InstallationDocument | null> {
    // Find user by GitHub username
    const user = await this.userModel.findOne({ username: githubUsername });
    if (!user || !user.organizationId) {
      return null;
    }

    const installation = await this.installationModel.findOneAndUpdate(
      { installationId },
      { organizationId: user.organizationId, userId: user._id },
      { new: true },
    );

    return installation;
  }

  async updateRepositorySettings(
    repoId: Types.ObjectId,
    settings: Repository['settings'],
  ): Promise<RepositoryDocument> {
    const repo = await this.repositoryModel.findByIdAndUpdate(
      repoId,
      { settings },
      { new: true },
    );

    if (!repo) {
      throw new NotFoundException('Repository not found');
    }

    return repo;
  }

  async toggleRepositoryActive(
    repoId: Types.ObjectId,
    isActive: boolean,
  ): Promise<RepositoryDocument> {
    const repo = await this.repositoryModel.findByIdAndUpdate(
      repoId,
      { isActive },
      { new: true },
    );

    if (!repo) {
      throw new NotFoundException('Repository not found');
    }

    return repo;
  }
}
