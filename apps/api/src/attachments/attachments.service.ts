import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class AttachmentsService {
  private readonly uploadDir: string;

  constructor(private readonly prisma: PrismaService) {
    this.uploadDir = path.resolve(process.cwd(), '../../storage/uploads');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async findByIssue(issueId: string, userId: string) {
    const issue = await this.prisma.issue.findUnique({ where: { id: issueId } });
    if (!issue) throw new NotFoundException({ code: 'ISSUE_NOT_FOUND', message: 'Issue not found' });
    await this.ensureProjectAccess(issue.projectId, userId);

    return this.prisma.attachment.findMany({
      where: { issueId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async upload(issueId: string, file: Express.Multer.File, userId: string) {
    const issue = await this.prisma.issue.findUnique({ where: { id: issueId } });
    if (!issue) throw new NotFoundException({ code: 'ISSUE_NOT_FOUND', message: 'Issue not found' });
    await this.ensureProjectAccess(issue.projectId, userId);

    const ext = path.extname(file.originalname);
    const filename = `${crypto.randomUUID()}${ext}`;
    const filepath = path.join(this.uploadDir, filename);

    fs.writeFileSync(filepath, file.buffer);

    const attachment = await this.prisma.attachment.create({
      data: {
        issueId,
        filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        uploadedById: userId,
      },
    });

    await this.prisma.activity.create({
      data: {
        issueId,
        userId,
        action: 'ATTACHMENT_ADDED',
        newValue: file.originalname,
      },
    });

    return attachment;
  }

  async delete(attachmentId: string, userId: string) {
    const attachment = await this.prisma.attachment.findUnique({ where: { id: attachmentId } });
    if (!attachment) throw new NotFoundException({ code: 'ATTACHMENT_NOT_FOUND', message: 'Attachment not found' });

    const issue = await this.prisma.issue.findUnique({ where: { id: attachment.issueId } });
    if (issue) await this.ensureProjectAccess(issue.projectId, userId);

    const filepath = path.join(this.uploadDir, attachment.filename);
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);

    await this.prisma.attachment.delete({ where: { id: attachmentId } });
    return { success: true };
  }

  getFilePath(filename: string): string {
    return path.join(this.uploadDir, filename);
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
