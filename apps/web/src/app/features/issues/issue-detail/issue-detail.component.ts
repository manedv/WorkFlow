import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { IssueService, Issue, Status } from '../../../core/services/issue.service';
import { ProjectService } from '../../../core/services/project.service';
import { NotificationService } from '../../../core/services/notification.service';
import { IssueCommentsComponent } from '../issue-comments/issue-comments.component';
import { IssueActivityComponent } from '../issue-activity/issue-activity.component';

@Component({
  selector: 'app-issue-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatNativeDateModule,
    IssueCommentsComponent,
    IssueActivityComponent,
  ],
  template: `
    @if (loading()) {
      <div class="loading-state">
        <mat-spinner diameter="40"></mat-spinner>
      </div>
    } @else if (issue()) {
      <div class="issue-detail">
        <div class="issue-header">
          <div class="breadcrumb">
            <a [routerLink]="['/projects', issue()!.projectId]">{{ issue()!.project?.name }}</a>
            <mat-icon>chevron_right</mat-icon>
            <span class="issue-key">{{ issue()!.issueKey }}</span>
          </div>
        </div>

        <div class="issue-layout">
          <div class="issue-main">
            <div class="summary-section">
              @if (editingSummary()) {
                <div class="inline-edit">
                  <input class="summary-input" [(ngModel)]="editSummaryValue"
                    (keyup.enter)="saveSummary()" (keyup.escape)="cancelEditSummary()">
                  <button mat-icon-button color="primary" (click)="saveSummary()">
                    <mat-icon>check</mat-icon>
                  </button>
                  <button mat-icon-button (click)="cancelEditSummary()">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>
              } @else {
                <h1 class="issue-summary" (click)="startEditSummary()">{{ issue()!.summary }}</h1>
              }
            </div>

            <div class="description-section">
              <h3>Description</h3>
              @if (editingDescription()) {
                <div class="inline-edit-block">
                  <textarea class="description-input" [(ngModel)]="editDescriptionValue" rows="6"></textarea>
                  <div class="edit-actions">
                    <button mat-flat-button color="primary" (click)="saveDescription()">Save</button>
                    <button mat-button (click)="cancelEditDescription()">Cancel</button>
                  </div>
                </div>
              } @else {
                <div class="description-content" (click)="startEditDescription()">
                  {{ issue()!.description || 'Click to add a description...' }}
                </div>
              }
            </div>

            @if (issue()!.subIssues && issue()!.subIssues.length > 0) {
              <div class="sub-issues-section">
                <h3>Sub-issues</h3>
                @for (sub of issue()!.subIssues; track sub.id) {
                  <div class="sub-issue-row">
                    <a [routerLink]="['/issues', sub.id]">{{ sub.issueKey }}</a>
                    <span>{{ sub.summary }}</span>
                  </div>
                }
              </div>
            }

            <app-issue-comments [issueId]="issue()!.id"></app-issue-comments>
            <app-issue-activity [issueId]="issue()!.id"></app-issue-activity>
          </div>

          <div class="issue-sidebar">
            <mat-card>
              <mat-card-content>
                <div class="sidebar-field">
                  <label>Status</label>
                  <mat-form-field appearance="outline" class="compact-field">
                    <mat-select [value]="issue()!.statusId" (selectionChange)="onStatusChange($event.value)">
                      @for (s of statuses(); track s.id) {
                        <mat-option [value]="s.id">{{ s.name }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                </div>

                <div class="sidebar-field">
                  <label>Priority</label>
                  <mat-form-field appearance="outline" class="compact-field">
                    <mat-select [value]="issue()!.priority" (selectionChange)="onPriorityChange($event.value)">
                      @for (p of priorities; track p.value) {
                        <mat-option [value]="p.value">
                          <mat-icon [style.color]="p.color" class="sm-icon">{{ p.icon }}</mat-icon>
                          {{ p.label }}
                        </mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                </div>

                <div class="sidebar-field">
                  <label>Assignee</label>
                  <mat-form-field appearance="outline" class="compact-field">
                    <mat-select [value]="issue()!.assigneeId" (selectionChange)="onAssigneeChange($event.value)">
                      <mat-option [value]="null">Unassigned</mat-option>
                      @for (m of members(); track m.id) {
                        <mat-option [value]="m.id">{{ m.name }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                </div>

                <div class="sidebar-field">
                  <label>Type</label>
                  <mat-form-field appearance="outline" class="compact-field">
                    <mat-select [value]="issue()!.type" (selectionChange)="onTypeChange($event.value)">
                      @for (t of issueTypes; track t.value) {
                        <mat-option [value]="t.value">
                          <mat-icon [style.color]="t.color" class="sm-icon">{{ t.icon }}</mat-icon>
                          {{ t.label }}
                        </mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                </div>

                <div class="sidebar-field">
                  <label>Story Points</label>
                  @if (editingStoryPoints()) {
                    <div class="inline-edit-sm">
                      <input type="number" min="0" [(ngModel)]="editStoryPointsValue"
                        (keyup.enter)="saveStoryPoints()" (keyup.escape)="cancelEditStoryPoints()">
                      <button mat-icon-button (click)="saveStoryPoints()"><mat-icon>check</mat-icon></button>
                      <button mat-icon-button (click)="cancelEditStoryPoints()"><mat-icon>close</mat-icon></button>
                    </div>
                  } @else {
                    <span class="clickable-value" (click)="startEditStoryPoints()">
                      {{ issue()!.storyPoints ?? 'None' }}
                    </span>
                  }
                </div>

                <div class="sidebar-field">
                  <label>Due Date</label>
                  <mat-form-field appearance="outline" class="compact-field">
                    <input matInput [matDatepicker]="duePicker"
                      [value]="issue()!.dueDate"
                      (dateChange)="onDueDateChange($event.value)">
                    <mat-datepicker-toggle matIconSuffix [for]="duePicker"></mat-datepicker-toggle>
                    <mat-datepicker #duePicker></mat-datepicker>
                  </mat-form-field>
                </div>

                <div class="sidebar-field">
                  <label>Reporter</label>
                  <span class="field-value">{{ issue()!.reporter.name }}</span>
                </div>

                <div class="sidebar-field">
                  <label>Created</label>
                  <span class="field-value">{{ issue()!.createdAt | date:'medium' }}</span>
                </div>

                <div class="sidebar-field">
                  <label>Updated</label>
                  <span class="field-value">{{ issue()!.updatedAt | date:'medium' }}</span>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .loading-state { display: flex; justify-content: center; padding: 64px; }
    .issue-detail { padding: 24px; max-width: 1200px; margin: 0 auto; }
    .issue-header { margin-bottom: 16px; }
    .breadcrumb {
      display: flex; align-items: center; gap: 4px;
      font-size: 14px; color: #757575;
      a { color: #5c6bc0; cursor: pointer; }
      a:hover { text-decoration: underline; }
    }
    .issue-key { font-weight: 600; color: #424242; }
    .issue-layout { display: grid; grid-template-columns: 1fr 320px; gap: 24px; }
    .issue-main { min-width: 0; }
    .issue-summary {
      font-size: 22px; font-weight: 600; color: #1a1a2e;
      cursor: pointer; padding: 4px 8px; border-radius: 4px;
    }
    .issue-summary:hover { background: #f5f5f5; }
    .inline-edit {
      display: flex; align-items: center; gap: 8px;
    }
    .summary-input {
      flex: 1; font-size: 22px; font-weight: 600;
      border: 2px solid #5c6bc0; border-radius: 4px;
      padding: 4px 8px; outline: none;
    }
    .description-section { margin-top: 24px; }
    .description-section h3 { font-size: 14px; font-weight: 600; color: #757575; margin-bottom: 8px; }
    .description-content {
      padding: 12px; border-radius: 4px; min-height: 80px;
      cursor: pointer; color: #424242; white-space: pre-wrap;
      border: 1px solid transparent;
    }
    .description-content:hover { background: #f5f5f5; border-color: #e0e0e0; }
    .inline-edit-block { display: flex; flex-direction: column; gap: 8px; }
    .description-input {
      width: 100%; border: 2px solid #5c6bc0; border-radius: 4px;
      padding: 12px; font-size: 14px; outline: none; resize: vertical;
      font-family: inherit;
    }
    .edit-actions { display: flex; gap: 8px; }
    .sub-issues-section { margin-top: 24px; }
    .sub-issues-section h3 { font-size: 14px; font-weight: 600; color: #757575; margin-bottom: 8px; }
    .sub-issue-row {
      display: flex; align-items: center; gap: 8px; padding: 8px;
      border-bottom: 1px solid #f0f0f0;
      a { color: #5c6bc0; font-weight: 500; font-size: 13px; }
    }
    .issue-sidebar mat-card { position: sticky; top: 24px; }
    .sidebar-field {
      margin-bottom: 16px;
      label { display: block; font-size: 11px; font-weight: 600; color: #9e9e9e; text-transform: uppercase; margin-bottom: 4px; }
    }
    .compact-field { width: 100%; }
    .sm-icon { font-size: 16px; width: 16px; height: 16px; margin-right: 4px; vertical-align: middle; }
    .field-value { font-size: 14px; color: #424242; }
    .clickable-value {
      font-size: 14px; color: #424242; cursor: pointer;
      padding: 4px 8px; border-radius: 4px;
    }
    .clickable-value:hover { background: #f5f5f5; }
    .inline-edit-sm {
      display: flex; align-items: center; gap: 4px;
      input { width: 60px; border: 1px solid #5c6bc0; border-radius: 4px; padding: 4px; }
    }

    @media (max-width: 768px) {
      .issue-layout { grid-template-columns: 1fr; }
    }
  `],
})
export class IssueDetailComponent implements OnInit {
  issue = signal<Issue | null>(null);
  statuses = signal<Status[]>([]);
  members = signal<{ id: string; name: string; email: string; avatar: string | null }[]>([]);
  loading = signal(true);

  editingSummary = signal(false);
  editingDescription = signal(false);
  editingStoryPoints = signal(false);

  editSummaryValue = '';
  editDescriptionValue = '';
  editStoryPointsValue: number | null = null;

  issueTypes = [
    { value: 'TASK', label: 'Task', icon: 'check_box', color: '#4285f4' },
    { value: 'BUG', label: 'Bug', icon: 'bug_report', color: '#ea4335' },
    { value: 'STORY', label: 'Story', icon: 'auto_stories', color: '#34a853' },
    { value: 'EPIC', label: 'Epic', icon: 'bolt', color: '#9c27b0' },
    { value: 'SUB_TASK', label: 'Sub-task', icon: 'subdirectory_arrow_right', color: '#607d8b' },
  ];

  priorities = [
    { value: 'URGENT', label: 'Urgent', icon: 'keyboard_double_arrow_up', color: '#d32f2f' },
    { value: 'HIGH', label: 'High', icon: 'keyboard_arrow_up', color: '#f44336' },
    { value: 'MEDIUM', label: 'Medium', icon: 'remove', color: '#ff9800' },
    { value: 'LOW', label: 'Low', icon: 'keyboard_arrow_down', color: '#4caf50' },
  ];

  constructor(
    private route: ActivatedRoute,
    private issueService: IssueService,
    private projectService: ProjectService,
    private notification: NotificationService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.issueService.getById(id).subscribe({
      next: (res) => {
        this.issue.set(res.data);
        this.loading.set(false);
        this.loadProjectData(res.data.projectId);
      },
      error: () => this.loading.set(false),
    });
  }

  private loadProjectData(projectId: string): void {
    this.issueService.getStatuses(projectId).subscribe({
      next: (res) => this.statuses.set(res.data),
    });
    this.projectService.getMembers(projectId).subscribe({
      next: (res) => this.members.set(res.data.map((m: any) => m.user)),
    });
  }

  startEditSummary(): void {
    this.editSummaryValue = this.issue()!.summary;
    this.editingSummary.set(true);
  }

  cancelEditSummary(): void {
    this.editingSummary.set(false);
  }

  saveSummary(): void {
    if (!this.editSummaryValue.trim()) return;
    this.issueService.update(this.issue()!.id, { summary: this.editSummaryValue }).subscribe({
      next: (res) => {
        this.issue.set({ ...this.issue()!, ...res.data });
        this.editingSummary.set(false);
      },
      error: () => this.notification.error('Failed to update summary'),
    });
  }

  startEditDescription(): void {
    this.editDescriptionValue = this.issue()!.description || '';
    this.editingDescription.set(true);
  }

  cancelEditDescription(): void {
    this.editingDescription.set(false);
  }

  saveDescription(): void {
    this.issueService.update(this.issue()!.id, { description: this.editDescriptionValue }).subscribe({
      next: (res) => {
        this.issue.set({ ...this.issue()!, ...res.data });
        this.editingDescription.set(false);
      },
      error: () => this.notification.error('Failed to update description'),
    });
  }

  startEditStoryPoints(): void {
    this.editStoryPointsValue = this.issue()!.storyPoints;
    this.editingStoryPoints.set(true);
  }

  cancelEditStoryPoints(): void {
    this.editingStoryPoints.set(false);
  }

  saveStoryPoints(): void {
    this.issueService.update(this.issue()!.id, { storyPoints: this.editStoryPointsValue as any }).subscribe({
      next: (res) => {
        this.issue.set({ ...this.issue()!, ...res.data });
        this.editingStoryPoints.set(false);
      },
      error: () => this.notification.error('Failed to update story points'),
    });
  }

  onStatusChange(statusId: string): void {
    this.issueService.updateStatus(this.issue()!.id, statusId).subscribe({
      next: (res) => this.issue.set({ ...this.issue()!, ...res.data }),
      error: () => this.notification.error('Failed to update status'),
    });
  }

  onPriorityChange(priority: string): void {
    this.issueService.updatePriority(this.issue()!.id, priority).subscribe({
      next: (res) => this.issue.set({ ...this.issue()!, ...res.data }),
      error: () => this.notification.error('Failed to update priority'),
    });
  }

  onAssigneeChange(assigneeId: string | null): void {
    this.issueService.updateAssignee(this.issue()!.id, assigneeId).subscribe({
      next: (res) => this.issue.set({ ...this.issue()!, ...res.data }),
      error: () => this.notification.error('Failed to update assignee'),
    });
  }

  onTypeChange(type: string): void {
    this.issueService.update(this.issue()!.id, { type }).subscribe({
      next: (res) => this.issue.set({ ...this.issue()!, ...res.data }),
      error: () => this.notification.error('Failed to update type'),
    });
  }

  onDueDateChange(date: Date | null): void {
    const dueDate = date ? date.toISOString() : null;
    this.issueService.update(this.issue()!.id, { dueDate } as any).subscribe({
      next: (res) => this.issue.set({ ...this.issue()!, ...res.data }),
      error: () => this.notification.error('Failed to update due date'),
    });
  }
}
