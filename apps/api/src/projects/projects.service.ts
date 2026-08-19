import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddMemberDto } from './dto/add-member.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    const memberships = await this.prisma.projectMember.findMany({
      where: { userId },
      include: {
        project: {
          include: {
            lead: { select: { id: true, name: true, email: true, avatar: true } },
            members: {
              include: {
                user: { select: { id: true, name: true, email: true, avatar: true } },
              },
            },
          },
        },
      },
    });

    return memberships.map((m) => ({
      ...m.project,
      currentUserRole: m.role,
    }));
  }

  async findById(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        lead: { select: { id: true, name: true, email: true, avatar: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } },
          },
        },
        organization: { select: { id: true, name: true } },
      },
    });

    if (!project) {
      throw new NotFoundException({
        code: 'PROJECT_NOT_FOUND',
        message: 'Project was not found',
      });
    }

    return project;
  }

  async create(dto: CreateProjectDto, userId: string) {
    const keyRegex = /^[A-Z][A-Z0-9]{1,9}$/;
    if (!keyRegex.test(dto.key)) {
      throw new BadRequestException({
        code: 'INVALID_PROJECT_KEY',
        message: 'Project key must be 2-10 uppercase letters/numbers, starting with a letter',
      });
    }

    const orgMembership = await this.prisma.organizationMember.findFirst({
      where: { userId, organizationId: dto.organizationId },
    });

    if (!orgMembership) {
      throw new ForbiddenException({
        code: 'NOT_ORG_MEMBER',
        message: 'You are not a member of this organization',
      });
    }

    const existingKey = await this.prisma.project.findFirst({
      where: { organizationId: dto.organizationId, key: dto.key },
    });

    if (existingKey) {
      throw new ConflictException({
        code: 'PROJECT_KEY_EXISTS',
        message: `A project with key "${dto.key}" already exists in this organization`,
      });
    }

    const project = await this.prisma.project.create({
      data: {
        name: dto.name,
        key: dto.key,
        description: dto.description,
        organizationId: dto.organizationId,
        leadId: dto.leadId || userId,
      },
    });

    await this.prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId,
        role: 'PROJECT_ADMIN',
      },
    });

    return this.findById(project.id);
  }

  async update(id: string, dto: UpdateProjectDto, userId: string) {
    await this.ensureProjectAccess(id, userId, ['PROJECT_ADMIN']);

    if (dto.key) {
      const keyRegex = /^[A-Z][A-Z0-9]{1,9}$/;
      if (!keyRegex.test(dto.key)) {
        throw new BadRequestException({
          code: 'INVALID_PROJECT_KEY',
          message: 'Project key must be 2-10 uppercase letters/numbers, starting with a letter',
        });
      }

      const project = await this.prisma.project.findUnique({ where: { id } });
      if (project) {
        const existingKey = await this.prisma.project.findFirst({
          where: {
            organizationId: project.organizationId,
            key: dto.key,
            id: { not: id },
          },
        });
        if (existingKey) {
          throw new ConflictException({
            code: 'PROJECT_KEY_EXISTS',
            message: `A project with key "${dto.key}" already exists`,
          });
        }
      }
    }

    await this.prisma.project.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.key !== undefined && { key: dto.key }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.leadId !== undefined && { leadId: dto.leadId }),
        ...(dto.isArchived !== undefined && { isArchived: dto.isArchived }),
      },
    });

    return this.findById(id);
  }

  async archive(id: string, userId: string) {
    await this.ensureProjectAccess(id, userId, ['PROJECT_ADMIN']);

    await this.prisma.project.update({
      where: { id },
      data: { isArchived: true },
    });

    return this.findById(id);
  }

  async delete(id: string, userId: string) {
    await this.ensureProjectAccess(id, userId, ['PROJECT_ADMIN']);
    await this.prisma.project.delete({ where: { id } });
    return { success: true };
  }

  async addMember(projectId: string, dto: AddMemberDto, userId: string) {
    await this.ensureProjectAccess(projectId, userId, ['PROJECT_ADMIN']);

    const existing = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: dto.userId } },
    });

    if (existing) {
      throw new ConflictException({
        code: 'MEMBER_EXISTS',
        message: 'User is already a member of this project',
      });
    }

    await this.prisma.projectMember.create({
      data: {
        projectId,
        userId: dto.userId,
        role: dto.role || 'MEMBER',
      },
    });

    return this.findById(projectId);
  }

  async removeMember(projectId: string, memberUserId: string, userId: string) {
    await this.ensureProjectAccess(projectId, userId, ['PROJECT_ADMIN']);

    const membership = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: memberUserId } },
    });

    if (!membership) {
      throw new NotFoundException({
        code: 'MEMBER_NOT_FOUND',
        message: 'Member not found in this project',
      });
    }

    await this.prisma.projectMember.delete({
      where: { id: membership.id },
    });

    return this.findById(projectId);
  }

  async getMembers(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException({
        code: 'PROJECT_NOT_FOUND',
        message: 'Project was not found',
      });
    }

    return this.prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });
  }

  private async ensureProjectAccess(
    projectId: string,
    userId: string,
    requiredRoles: string[],
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException({
        code: 'PROJECT_NOT_FOUND',
        message: 'Project was not found',
      });
    }

    const membership = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });

    if (!membership || !requiredRoles.includes(membership.role)) {
      throw new ForbiddenException({
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'You do not have permission to perform this action',
      });
    }
  }
}
