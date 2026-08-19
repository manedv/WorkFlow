import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { IssueService, Issue, Status, IssueFilters } from '../../../core/services/issue.service';
import { ProjectService } from '../../../core/services/project.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CreateIssueDialogComponent, CreateIssueDialogData } from '../create-issue-dialog/create-issue-dialog.component';

interface BoardColumn {
  status: Status;
  issues: Issue[];
}

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    DragDropModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatChipsModule,
    MatTooltipModule,
  ],
  template: `
    @if (loading()) {
      <div class="loading-state">
        <mat-spinner diameter="40"></mat-spinner>
      </div>
    } @else {
      <div class="board-container">
        <div class="board-header">
          <h1>Board</h1>
          <div class="board-actions">
            <button mat-flat-button color="primary" (click)="openCreateDialog()">
              <mat-icon>add</mat-icon> Create Issue
            </button>
          </div>
        </div>

        <div class="board-filters">
          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Assignee</mat-label>
            <mat-select [(value)]="filterAssignee" (selectionChange)="applyFilters()">
              <mat-option [value]="''">All</mat-option>
              @for (m of members(); track m.id) {
                <mat-option [value]="m.id">{{ m.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Priority</mat-label>
            <mat-select [(value)]="filterPriority" (selectionChange)="applyFilters()">
              <mat-option value="">All</mat-option>
              @for (p of priorities; track p.value) {
                <mat-option [value]="p.value">{{ p.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Type</mat-label>
            <mat-select [(value)]="filterType" (selectionChange)="applyFilters()">
              <mat-option value="">All</mat-option>
              @for (t of issueTypes; track t.value) {
                <mat-option [value]="t.value">{{ t.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          @if (filterAssignee || filterPriority || filterType) {
            <button mat-button (click)="clearFilters()">
              <mat-icon>clear</mat-icon> Clear
            </button>
          }
        </div>

        <div class="board-columns" cdkDropListGroup>
          @for (column of columns(); track column.status.id) {
            <div class="board-column">
              <div class="column-header">
                <span class="column-title">{{ column.status.name }}</span>
                <span class="column-count">{{ column.issues.length }}</span>
              </div>
              <div class="column-content"
                cdkDropList
                [cdkDropListData]="column.issues"
                [id]="column.status.id"
                [cdkDropListConnectedTo]="getConnectedLists(column.status.id)"
                (cdkDropListDropped)="onDrop($event, column.status)">
                @for (issue of column.issues; track issue.id) {
                  <div class="issue-card" cdkDrag [cdkDragData]="issue">
                    <div class="card-top">
                      <mat-icon class="type-icon" [style.color]="getTypeColor(issue.type)"
                        [matTooltip]="issue.type">
                        {{ getTypeIcon(issue.type) }}
                      </mat-icon>
                      <a class="issue-key-link" [routerLink]="['/issues', issue.id]">
                        {{ issue.issueKey }}
                      </a>
                    </div>
                    <div class="card-summary">
                      <a [routerLink]="['/issues', issue.id]">{{ issue.summary }}</a>
                    </div>
                    <div class="card-bottom">
                      <div class="card-meta">
                        <mat-icon class="priority-icon" [style.color]="getPriorityColor(issue.priority)"
                          [matTooltip]="issue.priority">
                          {{ getPriorityIcon(issue.priority) }}
                        </mat-icon>
                        @if (issue.storyPoints != null) {
                          <span class="story-points">{{ issue.storyPoints }}</span>
                        }
                      </div>
                      @if (issue.assignee) {
                        <div class="card-assignee" [matTooltip]="issue.assignee.name">
                          {{ issue.assignee.name.charAt(0).toUpperCase() }}
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .loading-state { display: flex; justify-content: center; padding: 64px; }

    .board-container { padding: 24px; height: calc(100vh - 64px); display: flex; flex-direction: column; }

    .board-header {
      display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;
      h1 { font-size: 24px; font-weight: 600; }
    }

    .board-filters {
      display: flex; gap: 12px; align-items: center; margin-bottom: 16px; flex-wrap: wrap;
    }

    .filter-field {
      width: 160px;
      ::ng-deep .mat-mdc-form-field-subscript-wrapper { display: none; }
    }

    .board-columns {
      display: flex; gap: 12px; flex: 1; overflow-x: auto; padding-bottom: 16px;
    }

    .board-column {
      min-width: 280px; width: 280px; display: flex; flex-direction: column;
      background: #f5f5f5; border-radius: 8px; max-height: calc(100vh - 220px);
    }

    .column-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 16px; font-weight: 600; font-size: 13px;
      text-transform: uppercase; color: #616161;
    }

    .column-count {
      background: #e0e0e0; border-radius: 10px; padding: 2px 8px;
      font-size: 12px; font-weight: 500;
    }

    .column-content {
      flex: 1; overflow-y: auto; padding: 0 8px 8px;
      min-height: 60px;
    }

    .issue-card {
      background: white; border-radius: 8px; padding: 12px;
      margin-bottom: 8px; cursor: grab;
      border: 1px solid #e8e8e8;
      transition: box-shadow 0.2s, transform 0.1s;
    }

    .issue-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.08); }

    .cdk-drag-preview {
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
      border-radius: 8px; opacity: 0.95;
    }

    .cdk-drag-placeholder {
      background: #e8eaf6; border: 2px dashed #7986cb;
      border-radius: 8px; min-height: 80px;
      opacity: 0.5;
    }

    .cdk-drag-animating { transition: transform 200ms ease; }

    .card-top {
      display: flex; align-items: center; gap: 6px; margin-bottom: 6px;
    }

    .type-icon { font-size: 16px; width: 16px; height: 16px; }

    .issue-key-link {
      font-size: 12px; font-weight: 600; color: #5c6bc0;
    }
    .issue-key-link:hover { text-decoration: underline; }

    .card-summary {
      font-size: 14px; color: #1a1a2e; line-height: 1.4; margin-bottom: 8px;
      a { color: inherit; }
      a:hover { color: #5c6bc0; }
    }

    .card-bottom {
      display: flex; align-items: center; justify-content: space-between;
    }

    .card-meta { display: flex; align-items: center; gap: 8px; }

    .priority-icon { font-size: 16px; width: 16px; height: 16px; }

    .story-points {
      font-size: 11px; font-weight: 600; background: #e8eaf6;
      color: #5c6bc0; padding: 2px 6px; border-radius: 4px;
    }

    .card-assignee {
      width: 24px; height: 24px; border-radius: 50%;
      background: #e8eaf6; color: #5c6bc0;
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 600;
    }

    @media (max-width: 768px) {
      .board-columns { flex-direction: column; }
      .board-column { min-width: 100%; width: 100%; max-height: none; }
    }
  `],
})
export class BoardComponent implements OnInit {
  columns = signal<BoardColumn[]>([]);
  members = signal<{ id: string; name: string; email: string; avatar: string | null }[]>([]);
  loading = signal(true);

  filterAssignee = '';
  filterPriority = '';
  filterType = '';

  private projectId = '';
  private allIssues: Issue[] = [];
  private statusList: Status[] = [];

  issueTypes = [
    { value: 'TASK', label: 'Task' },
    { value: 'BUG', label: 'Bug' },
    { value: 'STORY', label: 'Story' },
    { value: 'EPIC', label: 'Epic' },
    { value: 'SUB_TASK', label: 'Sub-task' },
  ];

  priorities = [
    { value: 'URGENT', label: 'Urgent' },
    { value: 'HIGH', label: 'High' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'LOW', label: 'Low' },
  ];

  constructor(
    private route: ActivatedRoute,
    private issueService: IssueService,
    private projectService: ProjectService,
    private notification: NotificationService,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('id')!;
    this.loadBoard();
    this.projectService.getMembers(this.projectId).subscribe({
      next: (res) => this.members.set(res.data.map((m: any) => m.user)),
    });
  }

  private loadBoard(): void {
    this.issueService.getStatuses(this.projectId).subscribe({
      next: (statusRes) => {
        this.statusList = statusRes.data;
        this.issueService.getByProject(this.projectId).subscribe({
          next: (issueRes) => {
            this.allIssues = issueRes.data;
            this.buildColumns();
            this.loading.set(false);
          },
          error: () => this.loading.set(false),
        });
      },
      error: () => this.loading.set(false),
    });
  }

  private buildColumns(): void {
    const filtered = this.getFilteredIssues();
    const cols: BoardColumn[] = this.statusList.map((status) => ({
      status,
      issues: filtered.filter((i) => i.statusId === status.id),
    }));
    this.columns.set(cols);
  }

  private getFilteredIssues(): Issue[] {
    return this.allIssues.filter((issue) => {
      if (this.filterAssignee && issue.assigneeId !== this.filterAssignee) return false;
      if (this.filterPriority && issue.priority !== this.filterPriority) return false;
      if (this.filterType && issue.type !== this.filterType) return false;
      return true;
    });
  }

  applyFilters(): void {
    this.buildColumns();
  }

  clearFilters(): void {
    this.filterAssignee = '';
    this.filterPriority = '';
    this.filterType = '';
    this.buildColumns();
  }

  getConnectedLists(currentId: string): string[] {
    return this.statusList.filter((s) => s.id !== currentId).map((s) => s.id);
  }

  onDrop(event: CdkDragDrop<Issue[]>, targetStatus: Status): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const issue = event.previousContainer.data[event.previousIndex];
      const previousStatusId = issue.statusId;

      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );

      issue.statusId = targetStatus.id;
      issue.status = targetStatus;

      this.issueService.updateStatus(issue.id, targetStatus.id).subscribe({
        error: () => {
          issue.statusId = previousStatusId;
          this.notification.error('Failed to update status. Changes reverted.');
          this.buildColumns();
        },
      });
    }
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(CreateIssueDialogComponent, {
      width: '600px',
      data: {
        projectId: this.projectId,
        members: this.members(),
      } as CreateIssueDialogData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.allIssues = [result, ...this.allIssues];
        this.buildColumns();
      }
    });
  }

  getTypeIcon(type: string): string {
    const map: Record<string, string> = {
      TASK: 'check_box', BUG: 'bug_report', STORY: 'auto_stories',
      EPIC: 'bolt', SUB_TASK: 'subdirectory_arrow_right',
    };
    return map[type] || 'check_box';
  }

  getTypeColor(type: string): string {
    const map: Record<string, string> = {
      TASK: '#4285f4', BUG: '#ea4335', STORY: '#34a853',
      EPIC: '#9c27b0', SUB_TASK: '#607d8b',
    };
    return map[type] || '#4285f4';
  }

  getPriorityIcon(priority: string): string {
    const map: Record<string, string> = {
      URGENT: 'keyboard_double_arrow_up', HIGH: 'keyboard_arrow_up',
      MEDIUM: 'remove', LOW: 'keyboard_arrow_down',
    };
    return map[priority] || 'remove';
  }

  getPriorityColor(priority: string): string {
    const map: Record<string, string> = {
      URGENT: '#d32f2f', HIGH: '#f44336', MEDIUM: '#ff9800', LOW: '#4caf50',
    };
    return map[priority] || '#ff9800';
  }
}
