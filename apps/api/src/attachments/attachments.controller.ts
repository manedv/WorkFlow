import {
  Controller, Get, Post, Delete, Param, Res, UseGuards, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as fs from 'fs';
import { AttachmentsService } from './attachments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
@UseGuards(JwtAuthGuard)
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Get('issues/:issueId/attachments')
  async findByIssue(@Param('issueId') issueId: string, @CurrentUser() user: { userId: string }) {
    const attachments = await this.attachmentsService.findByIssue(issueId, user.userId);
    return { success: true, data: attachments };
  }

  @Post('issues/:issueId/attachments')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async upload(
    @Param('issueId') issueId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: { userId: string },
  ) {
    const attachment = await this.attachmentsService.upload(issueId, file, user.userId);
    return { success: true, data: attachment };
  }

  @Get('attachments/:id/download')
  async download(@Param('id') id: string, @Res() res: Response, @CurrentUser() user: { userId: string }) {
    const attachments = await this.attachmentsService.findByIssue(id, user.userId).catch(() => null);
    // Direct file serve by filename
    const filepath = this.attachmentsService.getFilePath(id);
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    return res.sendFile(filepath);
  }

  @Delete('attachments/:id')
  async remove(@Param('id') id: string, @CurrentUser() user: { userId: string }) {
    await this.attachmentsService.delete(id, user.userId);
    return { success: true, data: { message: 'Attachment deleted' } };
  }
}
