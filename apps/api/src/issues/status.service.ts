import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatusService {
  constructor(private readonly prisma: PrismaService) {}

  async findByProject(projectId: string) {
    return this.prisma.status.findMany({
      where: { projectId },
      orderBy: { position: 'asc' },
    });
  }

  async create(projectId: string, data: { name: string; slug: string }, userId: string) {
    await this.ensureAdminAccess(projectId, userId);

    const existing = await this.prisma.status.findFirst({
      where: { projectId, slug: data.slug },
    });
    if (existing) throw new ConflictException({ code: 'STATUS_EXISTS', message: 'Status slug already exists' });

    const maxPosition = await this.prisma.status.findFirst({
      where: { projectId },
      orderBy: { position: 'desc' },
    });

    return this.prisma.status.create({
      data: {
        name: data.name,
        slug: data.slug,
        position: (maxPosition?.position ?? -1) + 1,
        projectId,
      },
    });
  }

  async update(id: string, data: { name?: string }, userId: string) {
    const status = await this.prisma.status.findUnique({ where: { id } });
    if (!status) throw new NotFoundException({ code: 'STATUS_NOT_FOUND', message: 'Status not found' });
    await this.ensureAdminAccess(status.projectId, userId);

    return this.prisma.status.update({
      where: { id },
      data: { ...(data.name && { name: data.name }) },
    });
  }

  async reorder(projectId: string, statusIds: string[], userId: string) {
    await this.ensureAdminAccess(projectId, userId);

    const updates = statusIds.map((id, index) =>
      this.prisma.status.update({ where: { id }, data: { position: index } }),
    );
    await this.prisma.$transaction(updates);

    return this.findByProject(projectId);
  }

  async delete(id: string, userId: string) {
    const status = await this.prisma.status.findUnique({ where: { id } });
    if (!status) throw new NotFoundException({ code: 'STATUS_NOT_FOUND', message: 'Status not found' });
    await this.ensureAdminAccess(status.projectId, userId);

    const issueCount = await this.prisma.issue.count({ where: { statusId: id } });
    if (issueCount > 0) {
      throw new ConflictException({
        code: 'STATUS_HAS_ISSUES',
        message: `Cannot delete status with ${issueCount} issue(s). Move them first.`,
      });
    }

    await this.prisma.status.delete({ where: { id } });
    return { success: true };
  }

  private async ensureAdminAccess(projectId: string, userId: string) {
    const membership = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (!membership || membership.role !== 'PROJECT_ADMIN') {
      throw new ForbiddenException({ code: 'NOT_ADMIN', message: 'Admin access required' });
    }
  }
}
