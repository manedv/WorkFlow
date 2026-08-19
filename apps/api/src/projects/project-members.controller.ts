import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { AddMemberDto } from './dto/add-member.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('projects/:projectId/members')
@UseGuards(JwtAuthGuard)
export class ProjectMembersController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  async getMembers(@Param('projectId') projectId: string) {
    const members = await this.projectsService.getMembers(projectId);
    return { success: true, data: members };
  }

  @Post()
  async addMember(
    @Param('projectId') projectId: string,
    @Body() dto: AddMemberDto,
    @CurrentUser() user: { userId: string },
  ) {
    const project = await this.projectsService.addMember(projectId, dto, user.userId);
    return { success: true, data: project };
  }

  @Delete(':userId')
  async removeMember(
    @Param('projectId') projectId: string,
    @Param('userId') memberUserId: string,
    @CurrentUser() user: { userId: string },
  ) {
    const project = await this.projectsService.removeMember(projectId, memberUserId, user.userId);
    return { success: true, data: project };
  }
}
