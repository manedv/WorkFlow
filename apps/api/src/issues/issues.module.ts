import { Module } from '@nestjs/common';
import { IssuesController } from './issues.controller';
import { IssuesService } from './issues.service';
import { ActivityService } from './activity.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [IssuesController],
  providers: [IssuesService, ActivityService],
  exports: [IssuesService, ActivityService],
})
export class IssuesModule {}
