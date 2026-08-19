import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByIssue(issueId: string, userId: string) {
    const issue = await this.prisma.issue.findUnique({ where: { id: issueId } });
    if (!issue) throw new NotFoundException({ code: 'ISSUE_NOT_FOUND', message: 'Issue not found' });
    await this.ensureProjectAccess(issue.projectId, userId);

    return this.prisma.comment.findMany({
      where: { issueId },
      include: {
        author: { select: { id: true, name: true, email: true, avatar: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(issueId: string, dto: CreateCommentDto, userId: string) {
    const issue = await this.prisma.issue.findUnique({ where: { id: issueId } });
    if (!issue) throw new NotFoundException({ code: 'ISSUE_NOT_FOUND', message: 'Issue not found' });
    await this.ensureProjectAccess(issue.projectId, userId);

    const comment = await this.prisma.comment.create({
      data: {
        content: dto.content,
        issueId,
        authorId: userId,
      },
      include: {
        author: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });

    // Create activity record
    await this.prisma.activity.create({
      data: {
        issueId,
        userId,
        action: 'COMMENTED',
      },
    });

    // Create notification for assignee if different from commenter
    if (issue.assigneeId && issue.assigneeId !== userId) {
      await this.prisma.notification.create({
        data: {
          userId: issue.assigneeId,
          type: 'COMMENT',
          title: 'New comment',
          message: `New comment on ${issue.issueKey}`,
          issueId,
        },
      });
    }

    return comment;
  }

  async update(commentId: string, dto: UpdateCommentDto, userId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException({ code: 'COMMENT_NOT_FOUND', message: 'Comment not found' });

    if (comment.authorId !== userId) {
      throw new ForbiddenException({ code: 'NOT_AUTHOR', message: 'Only the author can edit this comment' });
    }

    return this.prisma.comment.update({
      where: { id: commentId },
      data: { content: dto.content },
      include: {
        author: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });
  }

  async delete(commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException({ code: 'COMMENT_NOT_FOUND', message: 'Comment not found' });

    if (comment.authorId !== userId) {
      const issue = await this.prisma.issue.findUnique({ where: { id: comment.issueId } });
      if (issue) {
        const membership = await this.prisma.projectMember.findUnique({
          where: { projectId_userId: { projectId: issue.projectId, userId } },
        });
        if (!membership || membership.role !== 'PROJECT_ADMIN') {
          throw new ForbiddenException({ code: 'NOT_AUTHORIZED', message: 'Not authorized to delete this comment' });
        }
      }
    }

    await this.prisma.comment.delete({ where: { id: commentId } });
    return { success: true };
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
