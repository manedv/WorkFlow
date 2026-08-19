import {
  Controller, Get, Post, Patch, Delete, Param, Body, UseGuards,
} from '@nestjs/common';
import { StatusService } from './status.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('projects/:projectId/statuses')
@UseGuards(JwtAuthGuard)
export class StatusController {
  constructor(private readonly statusService: StatusService) {}

  @Get()
  async findAll(@Param('projectId') projectId: string) {
    const statuses = await this.statusService.findByProject(projectId);
    return { success: true, data: statuses };
  }

  @Post()
  async create(
    @Param('projectId') projectId: string,
    @Body() body: { name: string; slug: string },
    @CurrentUser() user: { userId: string },
  ) {
    const status = await this.statusService.create(projectId, body, user.userId);
    return { success: true, data: status };
  }

  @Patch('reorder')
  async reorder(
    @Param('projectId') projectId: string,
    @Body('statusIds') statusIds: string[],
    @CurrentUser() user: { userId: string },
  ) {
    const statuses = await this.statusService.reorder(projectId, statusIds, user.userId);
    return { success: true, data: statuses };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: { name?: string },
    @CurrentUser() user: { userId: string },
  ) {
    const status = await this.statusService.update(id, body, user.userId);
    return { success: true, data: status };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: { userId: string }) {
    await this.statusService.delete(id, user.userId);
    return { success: true, data: { message: 'Status deleted' } };
  }
}
