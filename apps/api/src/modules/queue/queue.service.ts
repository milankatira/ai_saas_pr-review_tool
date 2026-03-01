import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

export interface ReviewJobData {
  installationId: number;
  repositoryId: string;
  owner: string;
  repo: string;
  prNumber: number;
  prTitle: string;
  prAuthor: string;
  prUrl: string;
  commitSha: string;
  userId: string;
}

@Injectable()
export class QueueService {
  constructor(@InjectQueue('reviews') private reviewQueue: Queue) {}

  async addReviewJob(data: ReviewJobData): Promise<string> {
    console.log('Adding review job to queue:', data);
    const job = await this.reviewQueue.add('process-review', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: 100,
      removeOnFail: 1000,
    });

    console.log('Job added with ID:', job.id);
    return job.id.toString();
  }

  async getJobStatus(jobId: string) {
    const job = await this.reviewQueue.getJob(jobId);
    if (!job) {
      return null;
    }

    return {
      id: job.id,
      status: await job.getState(),
      progress: job.progress(),
      data: job.data,
      failedReason: job.failedReason,
    };
  }
}
