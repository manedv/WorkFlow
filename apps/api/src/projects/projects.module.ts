import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { ProjectMembersController } from './project-members.controller';

@Module({
  controllers: [ProjectsController, ProjectMembersController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
