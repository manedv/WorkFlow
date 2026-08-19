import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IssuesService } from './issues.service';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
@UseGuards(JwtAuthGuard)
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @Get('projects/:projectId/issues')
  async findAllByProject(
    @Param('projectId') projectId: string,
    @CurrentUser() user: { userId: string },
    @Query('assigneeId') assigneeId?: string,
    @Query('priority') priority?: string,
    @Query('type') type?: string,
    @Query('statusId') statusId?: string,
  ) {
    const issues = await this.issuesService.findAllByProject(projectId, user.userId, {
      assigneeId,
      priority,
      type,
      statusId,
    });
    return { success: true, data: issues };
  }

  @Post('projects/:projectId/issues')
  async create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateIssueDto,
    @CurrentUser() user: { userId: string },
  ) {
    const issue = await this.issuesService.create(projectId, dto, user.userId);
    return { success: true, data: issue };
  }

  @Get('projects/:projectId/statuses')
  async getStatuses(
    @Param('projectId') projectId: string,
  ) {
    const statuses = await this.issuesService.getStatuses(projectId);
    return { success: true, data: statuses };
  }

  @Get('projects/:projectId/issues/counts')
  async getIssueCounts(
    @Param('projectId') projectId: string,
  ) {
    const counts = await this.issuesService.getIssueCounts(projectId);
    return { success: true, data: counts };
  }

  @Get('issues/:id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
  ) {
    const issue = await this.issuesService.findById(id, user.userId);
    return { success: true, data: issue };
  }

  @Patch('issues/:id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateIssueDto,
    @CurrentUser() user: { userId: string },
  ) {
    const issue = await this.issuesService.update(id, dto, user.userId);
    return { success: true, data: issue };
  }

  @Delete('issues/:id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
  ) {
    await this.issuesService.delete(id, user.userId);
    return { success: true, data: { message: 'Issue deleted successfully' } };
  }

  @Patch('issues/:id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('statusId') statusId: string,
    @CurrentUser() user: { userId: string },
  ) {
    const issue = await this.issuesService.updateStatus(id, statusId, user.userId);
    return { success: true, data: issue };
  }

  @Patch('issues/:id/assignee')
  async updateAssignee(
    @Param('id') id: string,
    @Body('assigneeId') assigneeId: string | null,
    @CurrentUser() user: { userId: string },
  ) {
    const issue = await this.issuesService.updateAssignee(id, assigneeId, user.userId);
    return { success: true, data: issue };
  }

  @Patch('issues/:id/priority')
  async updatePriority(
    @Param('id') id: string,
    @Body('priority') priority: string,
    @CurrentUser() user: { userId: string },
  ) {
    const issue = await this.issuesService.updatePriority(id, priority, user.userId);
    return { success: true, data: issue };
  }
}
