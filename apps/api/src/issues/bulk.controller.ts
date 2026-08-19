import {
  Controller, Patch, Body, UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ActivityService } from './activity.service';

interface BulkUpdatePayload {
  issueIds: string[];
  statusId?: string;
  priority?: string;
  assigneeId?: string | null;
  sprintId?: string | null;
}

@Controller('issues/bulk')
@UseGuards(JwtAuthGuard)
export class BulkController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityService: ActivityService,
  ) {}

  @Patch()
  async bulkUpdate(@Body() payload: BulkUpdatePayload, @CurrentUser() user: { userId: string }) {
    const { issueIds, ...updates } = payload;
    if (!issueIds || issueIds.length === 0) {
      return { success: true, data: { updated: 0 } };
    }

    const data: any = {};
    if (updates.statusId !== undefined) data.statusId = updates.statusId;
    if (updates.priority !== undefined) data.priority = updates.priority;
    if (updates.assigneeId !== undefined) data.assigneeId = updates.assigneeId;
    if (updates.sprintId !== undefined) data.sprintId = updates.sprintId;

    const result = await this.prisma.issue.updateMany({
      where: { id: { in: issueIds } },
      data,
    });

    for (const issueId of issueIds) {
      if (updates.statusId) {
        await this.activityService.create({
          issueId, userId: user.userId, action: 'STATUS_CHANGED', field: 'status', newValue: updates.statusId,
        });
      }
      if (updates.priority) {
        await this.activityService.create({
          issueId, userId: user.userId, action: 'PRIORITY_CHANGED', field: 'priority', newValue: updates.priority,
        });
      }
      if (updates.assigneeId !== undefined) {
        await this.activityService.create({
          issueId, userId: user.userId, action: 'ASSIGNEE_CHANGED', field: 'assignee', newValue: updates.assigneeId || undefined,
        });
      }
    }

    return { success: true, data: { updated: result.count } };
  }
}
