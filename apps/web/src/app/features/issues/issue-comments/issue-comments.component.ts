import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule } from '@angular/material/menu';
import { CommentService, Comment } from '../../../core/services/comment.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-issue-comments',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatButtonModule,
    MatInputModule, MatFormFieldModule, MatMenuModule,
  ],
  template: `
    <div class="comments-section">
      <h3>Comments ({{ comments().length }})</h3>

      <div class="comment-input">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Add a comment...</mat-label>
          <textarea matInput [(ngModel)]="newComment" rows="3"></textarea>
        </mat-form-field>
        <button mat-flat-button color="primary" [disabled]="!newComment.trim()" (click)="addComment()">
          Comment
        </button>
      </div>

      <div class="comments-list">
        @for (comment of comments(); track comment.id) {
          <div class="comment-item">
            <div class="comment-header">
              <div class="comment-avatar">{{ comment.author.name.charAt(0).toUpperCase() }}</div>
              <div class="comment-meta">
                <span class="comment-author">{{ comment.author.name }}</span>
                <span class="comment-date">{{ comment.createdAt | date:'medium' }}</span>
              </div>
              @if (comment.authorId === currentUserId) {
                <button mat-icon-button [matMenuTriggerFor]="commentMenu" class="comment-menu-btn">
                  <mat-icon>more_horiz</mat-icon>
                </button>
                <mat-menu #commentMenu="matMenu">
                  <button mat-menu-item (click)="startEdit(comment)">
                    <mat-icon>edit</mat-icon> Edit
                  </button>
                  <button mat-menu-item (click)="deleteComment(comment.id)">
                    <mat-icon>delete</mat-icon> Delete
                  </button>
                </mat-menu>
              }
            </div>
            @if (editingId === comment.id) {
              <div class="edit-comment">
                <textarea class="edit-textarea" [(ngModel)]="editContent"></textarea>
                <div class="edit-actions">
                  <button mat-flat-button color="primary" (click)="saveEdit(comment.id)">Save</button>
                  <button mat-button (click)="cancelEdit()">Cancel</button>
                </div>
              </div>
            } @else {
              <div class="comment-content">{{ comment.content }}</div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .comments-section { margin-top: 32px; }
    .comments-section h3 { font-size: 14px; font-weight: 600; color: #757575; margin-bottom: 16px; }
    .comment-input { display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px; }
    .comment-input button { align-self: flex-end; }
    .full-width { width: 100%; }
    .comments-list { display: flex; flex-direction: column; gap: 16px; }
    .comment-item { padding: 12px; border: 1px solid #f0f0f0; border-radius: 8px; }
    .comment-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .comment-avatar {
      width: 28px; height: 28px; border-radius: 50%; background: #e8eaf6; color: #5c6bc0;
      display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600;
    }
    .comment-meta { flex: 1; display: flex; flex-direction: column; }
    .comment-author { font-size: 13px; font-weight: 600; color: #1a1a2e; }
    .comment-date { font-size: 11px; color: #9e9e9e; }
    .comment-menu-btn { opacity: 0; transition: opacity 0.2s; }
    .comment-item:hover .comment-menu-btn { opacity: 1; }
    .comment-content { font-size: 14px; color: #424242; white-space: pre-wrap; line-height: 1.5; }
    .edit-comment { display: flex; flex-direction: column; gap: 8px; }
    .edit-textarea {
      width: 100%; border: 1px solid #5c6bc0; border-radius: 4px; padding: 8px;
      font-size: 14px; font-family: inherit; resize: vertical; min-height: 60px;
    }
    .edit-actions { display: flex; gap: 8px; }
  `],
})
export class IssueCommentsComponent implements OnInit {
  @Input() issueId!: string;

  comments = signal<Comment[]>([]);
  newComment = '';
  editingId: string | null = null;
  editContent = '';
  currentUserId = '';

  constructor(
    private commentService: CommentService,
    private notification: NotificationService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadComments();
    const user = this.authService.currentUser();
    if (user) this.currentUserId = user.id;
  }

  private loadComments(): void {
    this.commentService.getByIssue(this.issueId).subscribe({
      next: (res) => this.comments.set(res.data),
    });
  }

  addComment(): void {
    if (!this.newComment.trim()) return;
    this.commentService.create(this.issueId, this.newComment).subscribe({
      next: (res) => {
        this.comments.set([...this.comments(), res.data]);
        this.newComment = '';
      },
      error: () => this.notification.error('Failed to add comment'),
    });
  }

  startEdit(comment: Comment): void {
    this.editingId = comment.id;
    this.editContent = comment.content;
  }

  cancelEdit(): void {
    this.editingId = null;
  }

  saveEdit(commentId: string): void {
    this.commentService.update(commentId, this.editContent).subscribe({
      next: (res) => {
        this.comments.set(this.comments().map((c) => c.id === commentId ? res.data : c));
        this.editingId = null;
      },
      error: () => this.notification.error('Failed to update comment'),
    });
  }

  deleteComment(commentId: string): void {
    this.commentService.delete(commentId).subscribe({
      next: () => this.comments.set(this.comments().filter((c) => c.id !== commentId)),
      error: () => this.notification.error('Failed to delete comment'),
    });
  }
}
