import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ActivityData {
  issueId: string;
  userId: string;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
}

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: ActivityData) {
    return this.prisma.activity.create({
      data: {
        issueId: data.issueId,
        userId: data.userId,
        action: data.action,
        field: data.field || null,
        oldValue: data.oldValue || null,
        newValue: data.newValue || null,
      },
    });
  }

  async findByIssue(issueId: string) {
    return this.prisma.activity.findMany({
      where: { issueId },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
