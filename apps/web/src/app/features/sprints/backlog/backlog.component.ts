import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { SprintService, Sprint } from '../../../core/services/sprint.service';
import { IssueService, Issue } from '../../../core/services/issue.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CreateIssueDialogComponent, CreateIssueDialogData } from '../../issues/create-issue-dialog/create-issue-dialog.component';
import { CreateSprintDialogComponent } from './create-sprint-dialog.component';
import { ProjectService } from '../../../core/services/project.service';

@Component({
  selector: 'app-backlog',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    DragDropModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatChipsModule,
    MatTooltipModule,
    MatMenuModule,
  ],
  template: `
    @if (loading()) {
      <div class="loading-state"><mat-spinner diameter="40"></mat-spinner></div>
    } @else {
      <div class="backlog-container">
        <div class="backlog-header">
          <h1>Backlog</h1>
          <div class="header-actions">
            <button mat-flat-button color="primary" (click)="openCreateIssue()">
              <mat-icon>add</mat-icon> Create Issue
            </button>
            <button mat-stroked-button (click)="openCreateSprint()">
              <mat-icon>add_circle_outline</mat-icon> Create Sprint
            </button>
          </div>
        </div>

        @for (sprint of sprints(); track sprint.id) {
          <mat-card class="sprint-card">
            <div class="sprint-header">
              <div class="sprint-info">
                <h3>{{ sprint.name }}</h3>
                <span class="sprint-status" [class]="sprint.status.toLowerCase()">{{ sprint.status }}</span>
                <span class="sprint-count">{{ (sprintIssues[sprint.id] || []).length }} issues</span>
              </div>
              <div class="sprint-actions">
                @if (sprint.status === 'PLANNING') {
                  <button mat-stroked-button color="primary" (click)="startSprint(sprint)">Start Sprint</button>
                }
                @if (sprint.status === 'ACTIVE') {
                  <button mat-stroked-button (click)="completeSprint(sprint)">Complete Sprint</button>
                }
                <button mat-icon-button [matMenuTriggerFor]="sprintMenu">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #sprintMenu="matMenu">
                  <button mat-menu-item (click)="deleteSprint(sprint)">
                    <mat-icon>delete</mat-icon> Delete Sprint
                  </button>
                </mat-menu>
              </div>
            </div>
            <div class="sprint-issues"
              cdkDropList [cdkDropListData]="sprintIssues[sprint.id] || []"
              [id]="'sprint-' + sprint.id"
              [cdkDropListConnectedTo]="getDropLists(sprint.id)"
              (cdkDropListDropped)="onDrop($event, sprint.id)">
              @for (issue of sprintIssues[sprint.id] || []; track issue.id) {
                <div class="backlog-issue" cdkDrag>
                  <mat-icon class="type-icon" [style.color]="getTypeColor(issue.type)">{{ getTypeIcon(issue.type) }}</mat-icon>
                  <a class="issue-key" [routerLink]="['/issues', issue.id]">{{ issue.issueKey }}</a>
                  <span class="issue-summary">{{ issue.summary }}</span>
                  <span class="issue-priority" [matTooltip]="issue.priority">
                    <mat-icon [style.color]="getPriorityColor(issue.priority)" class="sm-icon">{{ getPriorityIcon(issue.priority) }}</mat-icon>
                  </span>
                  @if (issue.storyPoints != null) {
                    <span class="story-points">{{ issue.storyPoints }}</span>
                  }
                </div>
              }
              @if (!(sprintIssues[sprint.id] || []).length) {
                <div class="empty-sprint">Drag issues here to plan this sprint</div>
              }
            </div>
          </mat-card>
        }

        <mat-card class="backlog-card">
          <div class="sprint-header">
            <div class="sprint-info">
              <h3>Backlog</h3>
              <span class="sprint-count">{{ backlogIssues().length }} issues</span>
            </div>
          </div>
          <div class="sprint-issues"
            cdkDropList [cdkDropListData]="backlogIssues()"
            id="backlog"
            [cdkDropListConnectedTo]="getDropLists('backlog')"
            (cdkDropListDropped)="onDrop($event, null)">
            @for (issue of backlogIssues(); track issue.id) {
              <div class="backlog-issue" cdkDrag>
                <mat-icon class="type-icon" [style.color]="getTypeColor(issue.type)">{{ getTypeIcon(issue.type) }}</mat-icon>
                <a class="issue-key" [routerLink]="['/issues', issue.id]">{{ issue.issueKey }}</a>
                <span class="issue-summary">{{ issue.summary }}</span>
                <span class="issue-priority" [matTooltip]="issue.priority">
                  <mat-icon [style.color]="getPriorityColor(issue.priority)" class="sm-icon">{{ getPriorityIcon(issue.priority) }}</mat-icon>
                </span>
                @if (issue.storyPoints != null) {
                  <span class="story-points">{{ issue.storyPoints }}</span>
                }
              </div>
            }
            @if (!backlogIssues().length) {
              <div class="empty-sprint">No issues in backlog</div>
            }
          </div>
        </mat-card>
      </div>
    }
  `,
  styles: [`
    .loading-state { display: flex; justify-content: center; padding: 64px; }
    .backlog-container { padding: 24px; max-width: 1000px; margin: 0 auto; }
    .backlog-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
    .backlog-header h1 { font-size: 24px; font-weight: 600; }
    .header-actions { display: flex; gap: 8px; }
    .sprint-card, .backlog-card { margin-bottom: 16px; }
    .sprint-header { display: flex; align-items: center; justify-content: space-between; padding: 16px; }
    .sprint-info { display: flex; align-items: center; gap: 12px; }
    .sprint-info h3 { font-size: 16px; font-weight: 600; margin: 0; }
    .sprint-status {
      font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 4px; text-transform: uppercase;
    }
    .sprint-status.planning { background: #e3f2fd; color: #1565c0; }
    .sprint-status.active { background: #e8f5e9; color: #2e7d32; }
    .sprint-status.completed { background: #f5f5f5; color: #757575; }
    .sprint-count { font-size: 13px; color: #757575; }
    .sprint-actions { display: flex; align-items: center; gap: 8px; }
    .sprint-issues { padding: 0 16px 16px; min-height: 40px; }
    .backlog-issue {
      display: flex; align-items: center; gap: 10px; padding: 8px 12px;
      border: 1px solid #e8e8e8; border-radius: 6px; margin-bottom: 4px;
      background: white; cursor: grab;
    }
    .backlog-issue:hover { background: #fafafa; }
    .type-icon { font-size: 16px; width: 16px; height: 16px; }
    .issue-key { font-size: 13px; font-weight: 600; color: #5c6bc0; min-width: 60px; }
    .issue-key:hover { text-decoration: underline; }
    .issue-summary { flex: 1; font-size: 14px; color: #1a1a2e; }
    .sm-icon { font-size: 16px; width: 16px; height: 16px; }
    .story-points { font-size: 11px; font-weight: 600; background: #e8eaf6; color: #5c6bc0; padding: 2px 6px; border-radius: 4px; }
    .empty-sprint { padding: 16px; text-align: center; color: #9e9e9e; font-size: 13px; border: 2px dashed #e0e0e0; border-radius: 6px; }
    .cdk-drag-preview { box-shadow: 0 4px 12px rgba(0,0,0,0.15); border-radius: 6px; }
    .cdk-drag-placeholder { opacity: 0.4; border: 2px dashed #7986cb; }
  `],
})
export class BacklogComponent implements OnInit {
  sprints = signal<Sprint[]>([]);
  backlogIssues = signal<Issue[]>([]);
  loading = signal(true);
  sprintIssues: Record<string, Issue[]> = {};
  private projectId = '';
  private members: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private sprintService: SprintService,
    private issueService: IssueService,
    private projectService: ProjectService,
    private notification: NotificationService,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('id')!;
    this.loadData();
    this.projectService.getMembers(this.projectId).subscribe({
      next: (res) => this.members = res.data.map((m: any) => m.user),
    });
  }

  private loadData(): void {
    this.sprintService.getByProject(this.projectId).subscribe({
      next: (res) => {
        this.sprints.set(res.data);
        res.data.forEach((s) => {
          this.sprintService.getById(s.id).subscribe({
            next: (r) => { this.sprintIssues[s.id] = r.data.issues || []; },
          });
        });
      },
    });
    this.sprintService.getBacklog(this.projectId).subscribe({
      next: (res) => { this.backlogIssues.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  getDropLists(current: string): string[] {
    const lists = this.sprints().map((s) => 'sprint-' + s.id);
    lists.push('backlog');
    return lists.filter((l) => l !== (current === 'backlog' ? 'backlog' : 'sprint-' + current));
  }

  onDrop(event: CdkDragDrop<Issue[]>, targetSprintId: string | null): void {
    if (event.previousContainer === event.container) return;
    const issue = event.previousContainer.data[event.previousIndex];
    transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);

    if (targetSprintId) {
      this.sprintService.addIssue(targetSprintId, issue.id).subscribe({
        error: () => { this.notification.error('Failed to move issue'); this.loadData(); },
      });
    } else {
      const prevId = event.previousContainer.id.replace('sprint-', '');
      this.sprintService.removeIssue(prevId, issue.id).subscribe({
        error: () => { this.notification.error('Failed to move issue'); this.loadData(); },
      });
    }
  }

  openCreateIssue(): void {
    const dialogRef = this.dialog.open(CreateIssueDialogComponent, {
      width: '600px',
      data: { projectId: this.projectId, members: this.members } as CreateIssueDialogData,
    });
    dialogRef.afterClosed().subscribe((result) => { if (result) this.loadData(); });
  }

  openCreateSprint(): void {
    const dialogRef = this.dialog.open(CreateSprintDialogComponent, {
      width: '500px',
      data: { projectId: this.projectId },
    });
    dialogRef.afterClosed().subscribe((result) => { if (result) this.loadData(); });
  }

  startSprint(sprint: Sprint): void {
    this.sprintService.start(sprint.id).subscribe({
      next: () => { this.notification.success('Sprint started'); this.loadData(); },
      error: (err) => this.notification.error(err.error?.message || 'Failed to start sprint'),
    });
  }

  completeSprint(sprint: Sprint): void {
    this.sprintService.complete(sprint.id).subscribe({
      next: () => { this.notification.success('Sprint completed'); this.loadData(); },
      error: (err) => this.notification.error(err.error?.message || 'Failed to complete sprint'),
    });
  }

  deleteSprint(sprint: Sprint): void {
    this.sprintService.delete(sprint.id).subscribe({
      next: () => { this.notification.success('Sprint deleted'); this.loadData(); },
      error: () => this.notification.error('Failed to delete sprint'),
    });
  }

  getTypeIcon(type: string): string {
    const map: Record<string, string> = { TASK: 'check_box', BUG: 'bug_report', STORY: 'auto_stories', EPIC: 'bolt', SUB_TASK: 'subdirectory_arrow_right' };
    return map[type] || 'check_box';
  }
  getTypeColor(type: string): string {
    const map: Record<string, string> = { TASK: '#4285f4', BUG: '#ea4335', STORY: '#34a853', EPIC: '#9c27b0', SUB_TASK: '#607d8b' };
    return map[type] || '#4285f4';
  }
  getPriorityIcon(p: string): string {
    const map: Record<string, string> = { URGENT: 'keyboard_double_arrow_up', HIGH: 'keyboard_arrow_up', MEDIUM: 'remove', LOW: 'keyboard_arrow_down' };
    return map[p] || 'remove';
  }
  getPriorityColor(p: string): string {
    const map: Record<string, string> = { URGENT: '#d32f2f', HIGH: '#f44336', MEDIUM: '#ff9800', LOW: '#4caf50' };
    return map[p] || '#ff9800';
  }
}
