import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  async findAll(@CurrentUser() user: { userId: string }) {
    const projects = await this.projectsService.findAll(user.userId);
    return { success: true, data: projects };
  }

  @Post()
  async create(
    @Body() dto: CreateProjectDto,
    @CurrentUser() user: { userId: string },
  ) {
    const project = await this.projectsService.create(dto, user.userId);
    return { success: true, data: project };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const project = await this.projectsService.findById(id);
    return { success: true, data: project };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: { userId: string },
  ) {
    const project = await this.projectsService.update(id, dto, user.userId);
    return { success: true, data: project };
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
  ) {
    await this.projectsService.archive(id, user.userId);
    return { success: true, data: { message: 'Project archived successfully' } };
  }
}
