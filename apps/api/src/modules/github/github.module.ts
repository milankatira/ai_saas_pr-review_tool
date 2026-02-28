import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GithubWebhookController, GithubController } from './github-webhook.controller';
import { GithubAppService } from './github-app.service';
import { GithubInstallationService } from './github-installation.service';
import { Installation, InstallationSchema } from './schemas/installation.schema';
import { Repository, RepositorySchema } from './schemas/repository.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Installation.name, schema: InstallationSchema },
      { name: Repository.name, schema: RepositorySchema },
      { name: User.name, schema: UserSchema },
    ]),
    forwardRef(() => QueueModule),
  ],
  controllers: [GithubWebhookController, GithubController],
  providers: [GithubAppService, GithubInstallationService],
  exports: [GithubAppService, GithubInstallationService],
})
export class GithubModule {}
