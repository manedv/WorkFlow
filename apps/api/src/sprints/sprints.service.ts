import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSprintDto, UpdateSprintDto } from './dto/sprint.dto';

@Injectable()
export class SprintsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByProject(projectId: string, userId: string) {
    await this.ensureProjectAccess(projectId, userId);
    return this.prisma.sprint.findMany({
      where: { projectId },
      include: { _count: { select: { issues: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, userId: string) {
    const sprint = await this.prisma.sprint.findUnique({
      where: { id },
      include: {
        issues: {
          include: {
            status: true,
            assignee: { select: { id: true, name: true, email: true, avatar: true } },
          },
          orderBy: { position: 'asc' },
        },
        _count: { select: { issues: true } },
      },
    });
    if (!sprint) throw new NotFoundException({ code: 'SPRINT_NOT_FOUND', message: 'Sprint not found' });
    await this.ensureProjectAccess(sprint.projectId, userId);
    return sprint;
  }

  async create(projectId: string, dto: CreateSprintDto, userId: string) {
    await this.ensureProjectAccess(projectId, userId);
    return this.prisma.sprint.create({
      data: {
        name: dto.name,
        goal: dto.goal || null,
        projectId,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      },
      include: { _count: { select: { issues: true } } },
    });
  }

  async update(id: string, dto: UpdateSprintDto, userId: string) {
    const sprint = await this.prisma.sprint.findUnique({ where: { id } });
    if (!sprint) throw new NotFoundException({ code: 'SPRINT_NOT_FOUND', message: 'Sprint not found' });
    await this.ensureProjectAccess(sprint.projectId, userId);

    return this.prisma.sprint.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.goal !== undefined && { goal: dto.goal }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.startDate !== undefined && { startDate: dto.startDate ? new Date(dto.startDate) : null }),
        ...(dto.endDate !== undefined && { endDate: dto.endDate ? new Date(dto.endDate) : null }),
      },
      include: { _count: { select: { issues: true } } },
    });
  }

  async start(id: string, userId: string) {
    const sprint = await this.prisma.sprint.findUnique({ where: { id } });
    if (!sprint) throw new NotFoundException({ code: 'SPRINT_NOT_FOUND', message: 'Sprint not found' });
    await this.ensureProjectAccess(sprint.projectId, userId);

    if (sprint.status !== 'PLANNING') {
      throw new BadRequestException({ code: 'INVALID_STATE', message: 'Only planning sprints can be started' });
    }

    const activeSprint = await this.prisma.sprint.findFirst({
      where: { projectId: sprint.projectId, status: 'ACTIVE' },
    });
    if (activeSprint) {
      throw new BadRequestException({ code: 'ACTIVE_SPRINT_EXISTS', message: 'Complete the active sprint first' });
    }

    return this.prisma.sprint.update({
      where: { id },
      data: { status: 'ACTIVE', startDate: sprint.startDate || new Date() },
      include: { _count: { select: { issues: true } } },
    });
  }

  async complete(id: string, userId: string) {
    const sprint = await this.prisma.sprint.findUnique({ where: { id } });
    if (!sprint) throw new NotFoundException({ code: 'SPRINT_NOT_FOUND', message: 'Sprint not found' });
    await this.ensureProjectAccess(sprint.projectId, userId);

    if (sprint.status !== 'ACTIVE') {
      throw new BadRequestException({ code: 'INVALID_STATE', message: 'Only active sprints can be completed' });
    }

    await this.prisma.issue.updateMany({
      where: { sprintId: id },
      data: { sprintId: null },
    });

    return this.prisma.sprint.update({
      where: { id },
      data: { status: 'COMPLETED', endDate: new Date() },
      include: { _count: { select: { issues: true } } },
    });
  }

  async delete(id: string, userId: string) {
    const sprint = await this.prisma.sprint.findUnique({ where: { id } });
    if (!sprint) throw new NotFoundException({ code: 'SPRINT_NOT_FOUND', message: 'Sprint not found' });
    await this.ensureProjectAccess(sprint.projectId, userId);

    await this.prisma.issue.updateMany({
      where: { sprintId: id },
      data: { sprintId: null },
    });
    await this.prisma.sprint.delete({ where: { id } });
    return { success: true };
  }

  async addIssue(sprintId: string, issueId: string, userId: string) {
    const sprint = await this.prisma.sprint.findUnique({ where: { id: sprintId } });
    if (!sprint) throw new NotFoundException({ code: 'SPRINT_NOT_FOUND', message: 'Sprint not found' });
    await this.ensureProjectAccess(sprint.projectId, userId);

    const issue = await this.prisma.issue.findUnique({ where: { id: issueId } });
    if (!issue || issue.projectId !== sprint.projectId) {
      throw new BadRequestException({ code: 'INVALID_ISSUE', message: 'Issue not found in this project' });
    }

    return this.prisma.issue.update({
      where: { id: issueId },
      data: { sprintId },
    });
  }

  async removeIssue(sprintId: string, issueId: string, userId: string) {
    const sprint = await this.prisma.sprint.findUnique({ where: { id: sprintId } });
    if (!sprint) throw new NotFoundException({ code: 'SPRINT_NOT_FOUND', message: 'Sprint not found' });
    await this.ensureProjectAccess(sprint.projectId, userId);

    return this.prisma.issue.update({
      where: { id: issueId },
      data: { sprintId: null },
    });
  }

  async getBacklog(projectId: string, userId: string) {
    await this.ensureProjectAccess(projectId, userId);
    return this.prisma.issue.findMany({
      where: { projectId, sprintId: null },
      include: {
        status: true,
        assignee: { select: { id: true, name: true, email: true, avatar: true } },
      },
      orderBy: { position: 'asc' },
    });
  }

  private async ensureProjectAccess(projectId: string, userId: string) {
    const membership = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (!membership) {
      throw new ForbiddenException({ code: 'NOT_PROJECT_MEMBER', message: 'You are not a member of this project' });
    }
  }
}
