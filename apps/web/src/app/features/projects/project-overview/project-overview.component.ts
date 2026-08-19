import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ProjectService, Project } from '../../../core/services/project.service';
import { IssueService, Issue, IssueCounts } from '../../../core/services/issue.service';
import { CreateIssueDialogComponent, CreateIssueDialogData } from '../../issues/create-issue-dialog/create-issue-dialog.component';

@Component({
  selector: 'app-project-overview',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
  template: `
    @if (loading()) {
      <div class="loading-state">
        <mat-spinner diameter="40"></mat-spinner>
      </div>
    } @else if (project()) {
      <div class="project-overview">
        <div class="project-header">
          <div class="project-title-row">
            <div class="project-avatar-lg">{{ project()!.key }}</div>
            <div>
              <h1>{{ project()!.name }}</h1>
              <span class="project-key-badge">{{ project()!.key }}</span>
              @if (project()!.isArchived) {
                <span class="archived-badge">Archived</span>
              }
            </div>
          </div>
          <div class="header-actions">
            <button mat-flat-button color="primary" (click)="openCreateIssue()">
              <mat-icon>add</mat-icon> Create Issue
            </button>
            <button mat-button color="primary" [routerLink]="['settings']">
              <mat-icon>settings</mat-icon> Settings
            </button>
          </div>
        </div>

        <mat-tab-group>
          <mat-tab label="Overview">
            <div class="tab-content">
              <div class="info-grid">
                <mat-card>
                  <mat-card-content>
                    <h3 class="card-title">Details</h3>
                    <div class="detail-list">
                      <div class="detail-row">
                        <span class="detail-label">Description</span>
                        <span class="detail-value">{{ project()!.description || 'No description' }}</span>
                      </div>
                      <div class="detail-row">
                        <span class="detail-label">Project Lead</span>
                        <span class="detail-value">{{ project()!.lead?.name || 'Unassigned' }}</span>
                      </div>
                      <div class="detail-row">
                        <span class="detail-label">Organization</span>
                        <span class="detail-value">{{ project()!.organization?.name }}</span>
                      </div>
                      <div class="detail-row">
                        <span class="detail-label">Created</span>
                        <span class="detail-value">{{ project()!.createdAt | date:'mediumDate' }}</span>
                      </div>
                    </div>
                  </mat-card-content>
                </mat-card>

                <mat-card>
                  <mat-card-content>
                    <h3 class="card-title">Issues Summary</h3>
                    <div class="issue-counts">
                      <div class="count-row total">
                        <span class="count-label">Total Issues</span>
                        <span class="count-value">{{ issueCounts()?.total || 0 }}</span>
                      </div>
                      @if (issueCounts()?.byStatus) {
                        @for (entry of statusEntries(); track entry[0]) {
                          <div class="count-row">
                            <span class="count-label">{{ formatStatus(entry[0]) }}</span>
                            <span class="count-value">{{ entry[1] }}</span>
                          </div>
                        }
                      }
                    </div>
                    <div class="quick-links">
                      <a mat-button [routerLink]="['board']">
                        <mat-icon>view_kanban</mat-icon> Open Board
                      </a>
                    </div>
                  </mat-card-content>
                </mat-card>

                <mat-card>
                  <mat-card-content>
                    <h3 class="card-title">Members ({{ project()!.members.length }})</h3>
                    <div class="members-list">
                      @for (member of project()!.members; track member.id) {
                        <div class="member-row">
                          <div class="member-avatar">
                            {{ member.user.name.charAt(0).toUpperCase() }}
                          </div>
                          <div class="member-info">
                            <span class="member-name">{{ member.user.name }}</span>
                            <span class="member-email">{{ member.user.email }}</span>
                          </div>
                          <span class="role-badge">{{ member.role }}</span>
                        </div>
                      }
                    </div>
                  </mat-card-content>
                </mat-card>
              </div>
            </div>
          </mat-tab>

          <mat-tab label="Issues">
            <div class="tab-content">
              <div class="issues-tab-content">
                @if (issues().length === 0) {
                  <div class="placeholder-content">
                    <mat-icon>assignment</mat-icon>
                    <h3>No issues yet</h3>
                    <p>Create your first issue to get started.</p>
                    <button mat-flat-button color="primary" (click)="openCreateIssue()">
                      <mat-icon>add</mat-icon> Create Issue
                    </button>
                  </div>
                } @else {
                  <div class="issue-list">
                    @for (issue of issues(); track issue.id) {
                      <a class="issue-row" [routerLink]="['/issues', issue.id]">
                        <mat-icon class="type-icon" [style.color]="getTypeColor(issue.type)">
                          {{ getTypeIcon(issue.type) }}
                        </mat-icon>
                        <span class="issue-key">{{ issue.issueKey }}</span>
                        <span class="issue-summary">{{ issue.summary }}</span>
                        <span class="issue-status">{{ issue.status.name }}</span>
                        <mat-icon class="priority-icon" [style.color]="getPriorityColor(issue.priority)">
                          {{ getPriorityIcon(issue.priority) }}
                        </mat-icon>
                      </a>
                    }
                  </div>
                }
              </div>
            </div>
          </mat-tab>

          <mat-tab label="Board">
            <div class="tab-content">
              <div class="placeholder-content">
                <mat-icon>view_kanban</mat-icon>
                <h3>Kanban Board</h3>
                <p>View your issues on the full board.</p>
                <a mat-flat-button color="primary" [routerLink]="['board']">
                  <mat-icon>open_in_new</mat-icon> Open Board
                </a>
              </div>
            </div>
          </mat-tab>

          <mat-tab label="Sprints">
            <div class="tab-content">
              <div class="placeholder-content">
                <mat-icon>speed</mat-icon>
                <h3>Sprints</h3>
                <p>Sprint planning will be available in Phase 3.</p>
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>
      </div>
    }
  `,
  styles: [`
    .loading-state { display: flex; justify-content: center; padding: 64px; }

    .project-overview { padding: 24px; max-width: 1200px; margin: 0 auto; }

    .project-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      margin-bottom: 24px;
    }

    .project-title-row {
      display: flex; align-items: center; gap: 16px;
      h1 { font-size: 24px; font-weight: 600; }
    }

    .header-actions { display: flex; gap: 8px; }

    .project-avatar-lg {
      width: 56px; height: 56px; border-radius: 12px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white; font-size: 18px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
    }

    .project-key-badge {
      display: inline-block; padding: 2px 8px;
      border-radius: 4px; font-size: 12px; font-weight: 600;
      background: #e8eaf6; color: #3f51b5; margin-right: 8px;
    }

    .archived-badge {
      display: inline-block; padding: 2px 8px;
      border-radius: 4px; font-size: 12px; font-weight: 500;
      background: #f5f5f5; color: #9e9e9e;
    }

    .tab-content { padding: 24px 0; }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 16px;
    }

    .card-title {
      font-size: 16px; font-weight: 600; color: #1a1a2e; margin-bottom: 16px;
    }

    .detail-list { display: flex; flex-direction: column; gap: 12px; }

    .detail-row {
      display: flex; flex-direction: column; gap: 2px;
      .detail-label { font-size: 12px; color: #9e9e9e; font-weight: 500; text-transform: uppercase; }
      .detail-value { font-size: 14px; color: #424242; }
    }

    .issue-counts { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }

    .count-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 6px 0; border-bottom: 1px solid #f0f0f0;
      .count-label { font-size: 14px; color: #616161; }
      .count-value { font-size: 14px; font-weight: 600; color: #424242; }
    }
    .count-row.total {
      .count-label { font-weight: 600; color: #1a1a2e; }
      .count-value { font-size: 18px; color: #5c6bc0; }
    }

    .quick-links { margin-top: 8px; }

    .members-list { display: flex; flex-direction: column; gap: 8px; }

    .member-row {
      display: flex; align-items: center; gap: 12px; padding: 4px 0;
    }

    .member-avatar {
      width: 32px; height: 32px; border-radius: 50%;
      background: #e8eaf6; color: #3f51b5;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; font-weight: 600;
    }

    .member-info {
      flex: 1; display: flex; flex-direction: column;
      .member-name { font-size: 14px; font-weight: 500; }
      .member-email { font-size: 12px; color: #9e9e9e; }
    }

    .role-badge {
      font-size: 11px; font-weight: 500; padding: 2px 8px;
      border-radius: 4px; background: #f5f5f5; color: #757575;
    }

    .issue-list { display: flex; flex-direction: column; }

    .issue-row {
      display: flex; align-items: center; gap: 12px; padding: 10px 12px;
      border-bottom: 1px solid #f0f0f0; transition: background 0.15s;
      cursor: pointer;
    }
    .issue-row:hover { background: #f9f9f9; }

    .type-icon { font-size: 18px; width: 18px; height: 18px; }
    .issue-key { font-size: 13px; font-weight: 600; color: #5c6bc0; min-width: 70px; }
    .issue-summary { flex: 1; font-size: 14px; color: #1a1a2e; }
    .issue-status {
      font-size: 12px; padding: 2px 8px; border-radius: 4px;
      background: #f5f5f5; color: #616161;
    }
    .priority-icon { font-size: 18px; width: 18px; height: 18px; }

    .placeholder-content {
      display: flex; flex-direction: column; align-items: center;
      padding: 64px 24px; text-align: center; color: #757575;
      mat-icon { font-size: 48px; width: 48px; height: 48px; color: #bdbdbd; margin-bottom: 12px; }
      h3 { font-size: 18px; font-weight: 500; margin-bottom: 4px; color: #424242; }
      p { margin-bottom: 16px; }
    }
  `],
})
export class ProjectOverviewComponent implements OnInit {
  project = signal<Project | null>(null);
  issueCounts = signal<IssueCounts | null>(null);
  issues = signal<Issue[]>([]);
  loading = signal(true);

  private projectId = '';

  constructor(
    private route: ActivatedRoute,
    private projectService: ProjectService,
    private issueService: IssueService,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('id')!;
    this.projectService.getById(this.projectId).subscribe({
      next: (res) => {
        this.project.set(res.data);
        this.loading.set(false);
        this.loadIssueData();
      },
      error: () => this.loading.set(false),
    });
  }

  private loadIssueData(): void {
    this.issueService.getIssueCounts(this.projectId).subscribe({
      next: (res) => this.issueCounts.set(res.data),
    });
    this.issueService.getByProject(this.projectId).subscribe({
      next: (res) => this.issues.set(res.data),
    });
  }

  statusEntries(): [string, number][] {
    const counts = this.issueCounts()?.byStatus;
    if (!counts) return [];
    return Object.entries(counts);
  }

  formatStatus(slug: string): string {
    return slug.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  openCreateIssue(): void {
    const members = this.project()!.members.map((m) => m.user);
    const dialogRef = this.dialog.open(CreateIssueDialogComponent, {
      width: '600px',
      data: { projectId: this.projectId, members } as CreateIssueDialogData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.issues.set([result, ...this.issues()]);
        this.loadIssueData();
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
