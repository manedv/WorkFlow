import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityService } from './activity.service';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';

const DEFAULT_STATUSES = [
  { name: 'Todo', slug: 'TODO', position: 0 },
  { name: 'In Progress', slug: 'IN_PROGRESS', position: 1 },
  { name: 'In Review', slug: 'IN_REVIEW', position: 2 },
  { name: 'Testing', slug: 'TESTING', position: 3 },
  { name: 'Done', slug: 'DONE', position: 4 },
];

@Injectable()
export class IssuesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityService: ActivityService,
  ) {}

  private readonly issueInclude = {
    status: true,
    reporter: { select: { id: true, name: true, email: true, avatar: true } },
    assignee: { select: { id: true, name: true, email: true, avatar: true } },
    parentIssue: { select: { id: true, issueKey: true, summary: true } },
    subIssues: { select: { id: true, issueKey: true, summary: true, type: true, priority: true, statusId: true } },
  };

  async ensureProjectStatuses(projectId: string) {
    const existing = await this.prisma.status.findFirst({ where: { projectId } });
    if (existing) return;

    await this.prisma.status.createMany({
      data: DEFAULT_STATUSES.map((s) => ({ ...s, projectId })),
    });
  }

  async getStatuses(projectId: string) {
    await this.ensureProjectStatuses(projectId);
    return this.prisma.status.findMany({
      where: { projectId },
      orderBy: { position: 'asc' },
    });
  }

  async findAllByProject(
    projectId: string,
    userId: string,
    filters?: { assigneeId?: string; priority?: string; type?: string; statusId?: string },
  ) {
    await this.ensureProjectAccess(projectId, userId);
    await this.ensureProjectStatuses(projectId);

    const where: any = { projectId };
    if (filters?.assigneeId) where.assigneeId = filters.assigneeId;
    if (filters?.priority) where.priority = filters.priority;
    if (filters?.type) where.type = filters.type;
    if (filters?.statusId) where.statusId = filters.statusId;

    return this.prisma.issue.findMany({
      where,
      include: this.issueInclude,
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async findById(id: string, userId: string) {
    const issue = await this.prisma.issue.findUnique({
      where: { id },
      include: {
        ...this.issueInclude,
        project: { select: { id: true, name: true, key: true } },
      },
    });

    if (!issue) {
      throw new NotFoundException({ code: 'ISSUE_NOT_FOUND', message: 'Issue not found' });
    }

    await this.ensureProjectAccess(issue.projectId, userId);
    return issue;
  }

  async create(projectId: string, dto: CreateIssueDto, userId: string) {
    await this.ensureProjectAccess(projectId, userId);
    await this.ensureProjectStatuses(projectId);

    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException({ code: 'PROJECT_NOT_FOUND', message: 'Project not found' });
    }

    if (!dto.summary || dto.summary.trim().length === 0) {
      throw new BadRequestException({ code: 'SUMMARY_REQUIRED', message: 'Summary is required' });
    }

    let statusId = dto.statusId;
    if (!statusId) {
      const todoStatus = await this.prisma.status.findFirst({
        where: { projectId, slug: 'TODO' },
      });
      if (!todoStatus) {
        throw new BadRequestException({ code: 'NO_STATUS', message: 'No default status found' });
      }
      statusId = todoStatus.id;
    }

    // Atomic issue number generation using transaction
    const issue = await this.prisma.$transaction(async (tx) => {
      const updatedProject = await tx.project.update({
        where: { id: projectId },
        data: { issueCounter: { increment: 1 } },
      });

      const issueNumber = updatedProject.issueCounter;
      const issueKey = `${project.key}-${issueNumber}`;

      return tx.issue.create({
        data: {
          issueKey,
          issueNumber,
          projectId,
          type: dto.type || 'TASK',
          summary: dto.summary.trim(),
          description: dto.description || null,
          statusId,
          priority: dto.priority || 'MEDIUM',
          reporterId: userId,
          assigneeId: dto.assigneeId || null,
          parentIssueId: dto.parentIssueId || null,
          storyPoints: dto.storyPoints ?? null,
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        },
        include: this.issueInclude,
      });
    });

    await this.activityService.create({
      issueId: issue.id,
      userId,
      action: 'CREATED',
    });

    return issue;
  }

  async update(id: string, dto: UpdateIssueDto, userId: string) {
    const existing = await this.findById(id, userId);

    const data: any = {};
    const activityPromises: Promise<any>[] = [];

    if (dto.summary !== undefined) {
      data.summary = dto.summary.trim();
      if (data.summary !== existing.summary) {
        activityPromises.push(
          this.activityService.create({
            issueId: id, userId, action: 'UPDATED', field: 'summary',
            oldValue: existing.summary, newValue: data.summary,
          }),
        );
      }
    }

    if (dto.description !== undefined) {
      data.description = dto.description;
      activityPromises.push(
        this.activityService.create({
          issueId: id, userId, action: 'UPDATED', field: 'description',
        }),
      );
    }

    if (dto.type !== undefined && dto.type !== existing.type) {
      data.type = dto.type;
      activityPromises.push(
        this.activityService.create({
          issueId: id, userId, action: 'UPDATED', field: 'type',
          oldValue: existing.type, newValue: dto.type,
        }),
      );
    }

    if (dto.priority !== undefined && dto.priority !== existing.priority) {
      data.priority = dto.priority;
      activityPromises.push(
        this.activityService.create({
          issueId: id, userId, action: 'PRIORITY_CHANGED', field: 'priority',
          oldValue: existing.priority, newValue: dto.priority,
        }),
      );
    }

    if (dto.statusId !== undefined && dto.statusId !== existing.statusId) {
      data.statusId = dto.statusId;
      activityPromises.push(
        this.activityService.create({
          issueId: id, userId, action: 'STATUS_CHANGED', field: 'status',
          oldValue: existing.statusId, newValue: dto.statusId,
        }),
      );
    }

    if (dto.assigneeId !== undefined && dto.assigneeId !== existing.assigneeId) {
      data.assigneeId = dto.assigneeId;
      activityPromises.push(
        this.activityService.create({
          issueId: id, userId, action: 'ASSIGNEE_CHANGED', field: 'assignee',
          oldValue: existing.assigneeId || undefined, newValue: dto.assigneeId || undefined,
        }),
      );
    }

    if (dto.parentIssueId !== undefined) data.parentIssueId = dto.parentIssueId;
    if (dto.storyPoints !== undefined) data.storyPoints = dto.storyPoints;
    if (dto.dueDate !== undefined) data.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;

    const updated = await this.prisma.issue.update({
      where: { id },
      data,
      include: this.issueInclude,
    });

    await Promise.all(activityPromises);

    return updated;
  }

  async updateStatus(id: string, statusId: string, userId: string) {
    return this.update(id, { statusId }, userId);
  }

  async updateAssignee(id: string, assigneeId: string | null, userId: string) {
    return this.update(id, { assigneeId }, userId);
  }

  async updatePriority(id: string, priority: string, userId: string) {
    return this.update(id, { priority } as UpdateIssueDto, userId);
  }

  async delete(id: string, userId: string) {
    const issue = await this.findById(id, userId);
    await this.ensureProjectAccess(issue.projectId, userId, ['PROJECT_ADMIN', 'MEMBER']);
    await this.prisma.issue.delete({ where: { id } });
    return { success: true };
  }

  async getIssueCounts(projectId: string) {
    const statuses = await this.prisma.status.findMany({ where: { projectId } });
    const counts: Record<string, number> = {};

    for (const status of statuses) {
      counts[status.slug] = await this.prisma.issue.count({
        where: { projectId, statusId: status.id },
      });
    }

    const total = await this.prisma.issue.count({ where: { projectId } });
    return { total, byStatus: counts };
  }

  async reorder(issueIds: string[], statusId: string, userId: string) {
    const updates = issueIds.map((id, index) =>
      this.prisma.issue.update({
        where: { id },
        data: { position: index, statusId },
      }),
    );
    await this.prisma.$transaction(updates);
  }

  private async ensureProjectAccess(projectId: string, userId: string, _roles?: string[]) {
    const membership = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });

    if (!membership) {
      throw new ForbiddenException({
        code: 'NOT_PROJECT_MEMBER',
        message: 'You are not a member of this project',
      });
    }
  }
}
