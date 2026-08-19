import {
  Controller, Get, Post, Patch, Delete, Param, Body, UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get('issues/:issueId/comments')
  async findByIssue(@Param('issueId') issueId: string, @CurrentUser() user: { userId: string }) {
    const comments = await this.commentsService.findByIssue(issueId, user.userId);
    return { success: true, data: comments };
  }

  @Post('issues/:issueId/comments')
  async create(@Param('issueId') issueId: string, @Body() dto: CreateCommentDto, @CurrentUser() user: { userId: string }) {
    const comment = await this.commentsService.create(issueId, dto, user.userId);
    return { success: true, data: comment };
  }

  @Patch('comments/:id')
  async update(@Param('id') id: string, @Body() dto: UpdateCommentDto, @CurrentUser() user: { userId: string }) {
    const comment = await this.commentsService.update(id, dto, user.userId);
    return { success: true, data: comment };
  }

  @Delete('comments/:id')
  async remove(@Param('id') id: string, @CurrentUser() user: { userId: string }) {
    await this.commentsService.delete(id, user.userId);
    return { success: true, data: { message: 'Comment deleted' } };
  }
}
