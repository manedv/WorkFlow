import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';
import { ProjectService, Project } from '../../core/services/project.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="dashboard">
      <div class="welcome-section">
        <h1>Welcome back, {{ firstName }}</h1>
        <p>Here's an overview of your workspace.</p>
      </div>

      <div class="stats-grid">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon projects-icon">
              <mat-icon>folder</mat-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ projects().length }}</span>
              <span class="stat-label">Projects</span>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon members-icon">
              <mat-icon>group</mat-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ totalMembers() }}</span>
              <span class="stat-label">Team Members</span>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon active-icon">
              <mat-icon>check_circle</mat-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ activeProjects() }}</span>
              <span class="stat-label">Active Projects</span>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="section">
        <div class="section-header">
          <h2>Recent Projects</h2>
          <button mat-button color="primary" routerLink="/projects">View all</button>
        </div>

        @if (loading()) {
          <div class="loading-state">
            <mat-spinner diameter="40"></mat-spinner>
          </div>
        } @else if (projects().length === 0) {
          <mat-card class="empty-card">
            <div class="empty-state">
              <mat-icon>folder_open</mat-icon>
              <h3>No projects yet</h3>
              <p>Create your first project to get started.</p>
              <button mat-raised-button color="primary" routerLink="/projects">
                Go to Projects
              </button>
            </div>
          </mat-card>
        } @else {
          <div class="project-grid">
            @for (project of projects().slice(0, 6); track project.id) {
              <mat-card class="project-card" [routerLink]="['/projects', project.id]">
                <mat-card-content>
                  <div class="project-card-header">
                    <div class="project-avatar">{{ project.key }}</div>
                    <div class="project-info">
                      <h3>{{ project.name }}</h3>
                      <span class="project-key">{{ project.key }}</span>
                    </div>
                  </div>
                  @if (project.description) {
                    <p class="project-desc">{{ project.description }}</p>
                  }
                  <div class="project-meta">
                    <span class="members-count">
                      <mat-icon>group</mat-icon>
                      {{ project.members.length }} members
                    </span>
                  </div>
                </mat-card-content>
              </mat-card>
            }
          </div>
        }
      </div>

      <div class="section">
        <div class="section-header">
          <h2>Recent Activity</h2>
        </div>
        <mat-card class="empty-card">
          <div class="empty-state" style="padding: 32px;">
            <mat-icon>history</mat-icon>
            <h3>Activity tracking</h3>
            <p>Activity feed will be available in a future phase.</p>
          </div>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .dashboard { padding: 24px; max-width: 1200px; margin: 0 auto; }

    .welcome-section {
      margin-bottom: 24px;
      h1 { font-size: 24px; font-weight: 600; color: #1a1a2e; margin-bottom: 4px; }
      p { color: #757575; font-size: 14px; }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }

    .stat-card {
      mat-card-content {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 20px !important;
      }
    }

    .stat-icon {
      width: 48px; height: 48px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      mat-icon { color: white; font-size: 24px; width: 24px; height: 24px; }

      &.projects-icon { background: linear-gradient(135deg, #667eea, #764ba2); }
      &.members-icon { background: linear-gradient(135deg, #43e97b, #38f9d7); }
      &.active-icon { background: linear-gradient(135deg, #f093fb, #f5576c); }
    }

    .stat-info {
      display: flex; flex-direction: column;
      .stat-value { font-size: 28px; font-weight: 700; color: #1a1a2e; line-height: 1; }
      .stat-label { font-size: 13px; color: #757575; margin-top: 2px; }
    }

    .section { margin-bottom: 32px; }

    .section-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 16px;
      h2 { font-size: 18px; font-weight: 600; color: #1a1a2e; }
    }

    .loading-state { display: flex; justify-content: center; padding: 48px; }

    .project-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    }

    .project-card {
      cursor: pointer;
      transition: transform 0.15s, box-shadow 0.15s;
      &:hover { transform: translateY(-2px); box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    }

    .project-card-header {
      display: flex; align-items: center; gap: 12px; margin-bottom: 8px;
    }

    .project-avatar {
      width: 40px; height: 40px; border-radius: 8px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white; font-size: 14px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
    }

    .project-info {
      h3 { font-size: 15px; font-weight: 600; color: #1a1a2e; }
      .project-key { font-size: 12px; color: #9e9e9e; font-weight: 500; }
    }

    .project-desc {
      font-size: 13px; color: #757575;
      overflow: hidden; text-overflow: ellipsis;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
      margin-bottom: 12px;
    }

    .project-meta {
      display: flex; align-items: center; gap: 16px;
      .members-count {
        display: flex; align-items: center; gap: 4px;
        font-size: 12px; color: #9e9e9e;
        mat-icon { font-size: 16px; width: 16px; height: 16px; }
      }
    }

    .empty-card { border: 1px dashed #e0e0e0; }
  `],
})
export class DashboardComponent implements OnInit {
  projects = signal<Project[]>([]);
  loading = signal(true);

  get firstName(): string {
    return this.authService.currentUser()?.name?.split(' ')[0] ?? '';
  }

  constructor(
    public authService: AuthService,
    private projectService: ProjectService,
  ) {}

  ngOnInit(): void {
    this.projectService.getAll().subscribe({
      next: (res) => {
        this.projects.set(res.data.filter((p) => !p.isArchived));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  totalMembers(): number {
    const memberIds = new Set<string>();
    this.projects().forEach((p) => p.members.forEach((m) => memberIds.add(m.userId)));
    return memberIds.size;
  }

  activeProjects(): number {
    return this.projects().filter((p) => !p.isArchived).length;
  }
}
