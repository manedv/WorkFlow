import { Module } from '@nestjs/common';
import { IssuesController } from './issues.controller';
import { IssuesService } from './issues.service';
import { ActivityService } from './activity.service';
import { StatusService } from './status.service';
import { StatusController } from './status.controller';
import { BulkController } from './bulk.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [IssuesController, StatusController, BulkController],
  providers: [IssuesService, ActivityService, StatusService],
  exports: [IssuesService, ActivityService, StatusService],
})
export class IssuesModule {}
