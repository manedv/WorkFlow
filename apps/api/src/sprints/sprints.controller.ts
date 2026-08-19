import {
  Controller, Get, Post, Patch, Delete, Param, Body, UseGuards,
} from '@nestjs/common';
import { SprintsService } from './sprints.service';
import { CreateSprintDto, UpdateSprintDto } from './dto/sprint.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
@UseGuards(JwtAuthGuard)
export class SprintsController {
  constructor(private readonly sprintsService: SprintsService) {}

  @Get('projects/:projectId/sprints')
  async findAll(@Param('projectId') projectId: string, @CurrentUser() user: { userId: string }) {
    const sprints = await this.sprintsService.findAllByProject(projectId, user.userId);
    return { success: true, data: sprints };
  }

  @Post('projects/:projectId/sprints')
  async create(@Param('projectId') projectId: string, @Body() dto: CreateSprintDto, @CurrentUser() user: { userId: string }) {
    const sprint = await this.sprintsService.create(projectId, dto, user.userId);
    return { success: true, data: sprint };
  }

  @Get('projects/:projectId/backlog')
  async getBacklog(@Param('projectId') projectId: string, @CurrentUser() user: { userId: string }) {
    const issues = await this.sprintsService.getBacklog(projectId, user.userId);
    return { success: true, data: issues };
  }

  @Get('sprints/:id')
  async findOne(@Param('id') id: string, @CurrentUser() user: { userId: string }) {
    const sprint = await this.sprintsService.findById(id, user.userId);
    return { success: true, data: sprint };
  }

  @Patch('sprints/:id')
  async update(@Param('id') id: string, @Body() dto: UpdateSprintDto, @CurrentUser() user: { userId: string }) {
    const sprint = await this.sprintsService.update(id, dto, user.userId);
    return { success: true, data: sprint };
  }

  @Post('sprints/:id/start')
  async start(@Param('id') id: string, @CurrentUser() user: { userId: string }) {
    const sprint = await this.sprintsService.start(id, user.userId);
    return { success: true, data: sprint };
  }

  @Post('sprints/:id/complete')
  async complete(@Param('id') id: string, @CurrentUser() user: { userId: string }) {
    const sprint = await this.sprintsService.complete(id, user.userId);
    return { success: true, data: sprint };
  }

  @Delete('sprints/:id')
  async remove(@Param('id') id: string, @CurrentUser() user: { userId: string }) {
    await this.sprintsService.delete(id, user.userId);
    return { success: true, data: { message: 'Sprint deleted' } };
  }

  @Post('sprints/:id/issues/:issueId')
  async addIssue(@Param('id') id: string, @Param('issueId') issueId: string, @CurrentUser() user: { userId: string }) {
    const issue = await this.sprintsService.addIssue(id, issueId, user.userId);
    return { success: true, data: issue };
  }

  @Delete('sprints/:id/issues/:issueId')
  async removeIssue(@Param('id') id: string, @Param('issueId') issueId: string, @CurrentUser() user: { userId: string }) {
    const issue = await this.sprintsService.removeIssue(id, issueId, user.userId);
    return { success: true, data: issue };
  }
}
