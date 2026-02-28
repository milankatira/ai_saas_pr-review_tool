import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';

export interface PRDiff {
  files: {
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    patch?: string;
  }[];
  totalAdditions: number;
  totalDeletions: number;
}

export interface ReviewComment {
  path: string;
  line: number;
  body: string;
}

@Injectable()
export class GithubAppService {
  private appId: string;
  private privateKey: string;

  constructor(private configService: ConfigService) {
    this.appId = this.configService.get<string>('github.appId') || '';
    this.privateKey = this.configService.get<string>('github.privateKey') || '';
  }

  async getInstallationClient(installationId: number): Promise<Octokit> {
    const auth = createAppAuth({
      appId: this.appId,
      privateKey: this.privateKey,
      installationId,
    });

    const installationAuth = await auth({ type: 'installation' });

    return new Octokit({
      auth: installationAuth.token,
    });
  }

  async fetchPRDiff(
    installationId: number,
    owner: string,
    repo: string,
    prNumber: number,
  ): Promise<PRDiff> {
    const octokit = await this.getInstallationClient(installationId);

    const { data: files } = await octokit.pulls.listFiles({
      owner,
      repo,
      pull_number: prNumber,
      per_page: 100,
    });

    const totalAdditions = files.reduce((sum, f) => sum + f.additions, 0);
    const totalDeletions = files.reduce((sum, f) => sum + f.deletions, 0);

    return {
      files: files.map((f) => ({
        filename: f.filename,
        status: f.status,
        additions: f.additions,
        deletions: f.deletions,
        patch: f.patch,
      })),
      totalAdditions,
      totalDeletions,
    };
  }

  async fetchPRDetails(
    installationId: number,
    owner: string,
    repo: string,
    prNumber: number,
  ) {
    const octokit = await this.getInstallationClient(installationId);

    const { data: pr } = await octokit.pulls.get({
      owner,
      repo,
      pull_number: prNumber,
    });

    return {
      number: pr.number,
      title: pr.title,
      body: pr.body || '',
      author: pr.user?.login || 'unknown',
      baseBranch: pr.base.ref,
      headBranch: pr.head.ref,
      headSha: pr.head.sha,
      url: pr.html_url,
    };
  }

  async createReview(
    installationId: number,
    owner: string,
    repo: string,
    prNumber: number,
    body: string,
    comments: ReviewComment[],
    event: 'COMMENT' | 'REQUEST_CHANGES' | 'APPROVE' = 'COMMENT',
  ) {
    const octokit = await this.getInstallationClient(installationId);

    const reviewComments = comments.map((c) => ({
      path: c.path,
      line: c.line,
      body: c.body,
    }));

    const { data } = await octokit.pulls.createReview({
      owner,
      repo,
      pull_number: prNumber,
      body,
      event,
      comments: reviewComments,
    });

    return data;
  }

  async postComment(
    installationId: number,
    owner: string,
    repo: string,
    issueNumber: number,
    body: string,
  ) {
    const octokit = await this.getInstallationClient(installationId);

    const { data } = await octokit.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body,
    });

    return data;
  }
}
