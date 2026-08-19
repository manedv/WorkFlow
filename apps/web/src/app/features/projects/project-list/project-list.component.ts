import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ProjectService, Project } from '../../../core/services/project.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CreateProjectDialogComponent } from '../create-project-dialog/create-project-dialog.component';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatMenuModule,
    MatDialogModule,
  ],
  template: `
    <div class="container">
      <div class="page-header">
        <h1>Projects</h1>
        <button mat-raised-button color="primary" (click)="openCreateDialog()">
          <mat-icon>add</mat-icon>
          Create Project
        </button>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else if (projects().length === 0) {
        <div class="empty-state">
          <mat-icon>folder_open</mat-icon>
          <h3>No projects yet</h3>
          <p>Create your first project to get started with WorkFlow.</p>
          <button mat-raised-button color="primary" (click)="openCreateDialog()">
            <mat-icon>add</mat-icon>
            Create Project
          </button>
        </div>
      } @else {
        <div class="project-table">
          <div class="table-header">
            <span class="col-name">Project</span>
            <span class="col-key">Key</span>
            <span class="col-lead">Lead</span>
            <span class="col-members">Members</span>
            <span class="col-status">Status</span>
            <span class="col-actions"></span>
          </div>
          @for (project of projects(); track project.id) {
            <div class="table-row" [class.archived]="project.isArchived">
              <div class="col-name">
                <div class="project-avatar">{{ project.key }}</div>
                <a [routerLink]="['/projects', project.id]" class="project-name-link">
                  {{ project.name }}
                </a>
              </div>
              <span class="col-key">
                <mat-icon class="key-icon">vpn_key</mat-icon>
                {{ project.key }}
              </span>
              <span class="col-lead">{{ project.lead?.name || 'Unassigned' }}</span>
              <span class="col-members">
                <mat-icon class="member-icon">group</mat-icon>
                {{ project.members.length }}
              </span>
              <span class="col-status">
                <span class="status-badge" [class.archived]="project.isArchived">
                  {{ project.isArchived ? 'Archived' : 'Active' }}
                </span>
              </span>
              <span class="col-actions">
                <button mat-icon-button [matMenuTriggerFor]="menu">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  <button mat-menu-item [routerLink]="['/projects', project.id]">
                    <mat-icon>open_in_new</mat-icon> Open
                  </button>
                  <button mat-menu-item [routerLink]="['/projects', project.id, 'settings']">
                    <mat-icon>edit</mat-icon> Edit
                  </button>
                  @if (!project.isArchived) {
                    <button mat-menu-item (click)="archiveProject(project)">
                      <mat-icon>archive</mat-icon> Archive
                    </button>
                  }
                </mat-menu>
              </span>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .loading-state { display: flex; justify-content: center; padding: 64px; }

    .project-table {
      background: white;
      border-radius: 12px;
      border: 1px solid #e0e0e0;
      overflow: hidden;
    }

    .table-header {
      display: grid;
      grid-template-columns: 2fr 100px 150px 100px 100px 56px;
      padding: 12px 16px;
      background: #fafafa;
      border-bottom: 1px solid #e0e0e0;
      font-size: 12px;
      font-weight: 600;
      color: #757575;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .table-row {
      display: grid;
      grid-template-columns: 2fr 100px 150px 100px 100px 56px;
      padding: 12px 16px;
      align-items: center;
      border-bottom: 1px solid #f5f5f5;
      font-size: 14px;
      transition: background-color 0.1s;

      &:hover { background: #fafafa; }
      &:last-child { border-bottom: none; }
      &.archived { opacity: 0.6; }
    }

    .col-name {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .project-avatar {
      width: 32px; height: 32px; border-radius: 6px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white; font-size: 11px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }

    .project-name-link {
      font-weight: 500; color: #1a1a2e;
      &:hover { color: #3f51b5; text-decoration: underline; }
    }

    .col-key, .col-lead, .col-members {
      display: flex; align-items: center; gap: 4px; color: #616161;
    }

    .key-icon, .member-icon {
      font-size: 16px; width: 16px; height: 16px; color: #9e9e9e;
    }

    .status-badge {
      display: inline-block; padding: 2px 10px;
      border-radius: 12px; font-size: 12px; font-weight: 500;
      background: #e8f5e9; color: #2e7d32;

      &.archived { background: #f5f5f5; color: #9e9e9e; }
    }
  `],
})
export class ProjectListComponent implements OnInit {
  projects = signal<Project[]>([]);
  loading = signal(true);

  constructor(
    private projectService: ProjectService,
    private notification: NotificationService,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.loading.set(true);
    this.projectService.getAll().subscribe({
      next: (res) => {
        this.projects.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.notification.error('Failed to load projects');
        this.loading.set(false);
      },
    });
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(CreateProjectDialogComponent, {
      width: '500px',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadProjects();
      }
    });
  }

  archiveProject(project: Project): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Archive Project',
        message: `Are you sure you want to archive "${project.name}"? This can be undone later.`,
        confirmText: 'Archive',
        confirmColor: 'warn',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.projectService.archive(project.id).subscribe({
          next: () => {
            this.notification.success('Project archived');
            this.loadProjects();
          },
          error: () => this.notification.error('Failed to archive project'),
        });
      }
    });
  }
}
