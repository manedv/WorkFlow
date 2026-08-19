import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  active: boolean;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatDividerModule,
  ],
  template: `
    <div class="app-layout">
      <mat-toolbar class="app-toolbar" color="primary">
        <button mat-icon-button (click)="toggleSidebar()">
          <mat-icon>menu</mat-icon>
        </button>
        <span class="brand" routerLink="/dashboard">
          <mat-icon class="brand-icon">hub</mat-icon>
          WorkFlow
        </span>

        <span class="spacer"></span>

        <div class="toolbar-right">
          <button mat-icon-button [matMenuTriggerFor]="userMenu">
            <mat-icon>account_circle</mat-icon>
          </button>
          <mat-menu #userMenu="matMenu">
            <div class="user-menu-header">
              <strong>{{ authService.currentUser()?.name }}</strong>
              <small>{{ authService.currentUser()?.email }}</small>
            </div>
            <mat-divider></mat-divider>
            <button mat-menu-item routerLink="/settings">
              <mat-icon>settings</mat-icon>
              <span>Settings</span>
            </button>
            <button mat-menu-item (click)="authService.logout()">
              <mat-icon>logout</mat-icon>
              <span>Log out</span>
            </button>
          </mat-menu>
        </div>
      </mat-toolbar>

      <div class="app-body">
        <div class="sidebar" [class.collapsed]="sidebarCollapsed()">
          <nav>
            @for (item of navItems; track item.route) {
              <a
                class="nav-item"
                [routerLink]="item.route"
                routerLinkActive="active"
              >
                <mat-icon>{{ item.icon }}</mat-icon>
                @if (!sidebarCollapsed()) {
                  <span>{{ item.label }}</span>
                }
              </a>
            }
          </nav>
        </div>

        <main class="main-content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    .app-layout {
      display: flex;
      flex-direction: column;
      height: 100vh;
    }

    .app-toolbar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 8px;
      height: 56px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      font-weight: 600;
      cursor: pointer;
      letter-spacing: -0.3px;
    }

    .brand-icon {
      font-size: 24px;
    }

    .spacer { flex: 1 1 auto; }

    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .user-menu-header {
      padding: 12px 16px;
      display: flex;
      flex-direction: column;
      gap: 2px;

      small { color: #757575; font-size: 12px; }
    }

    .app-body {
      display: flex;
      margin-top: 56px;
      height: calc(100vh - 56px);
    }

    .sidebar {
      width: 240px;
      min-width: 240px;
      background: #fff;
      border-right: 1px solid #e0e0e0;
      padding: 8px 0;
      overflow-y: auto;
      transition: width 0.2s ease, min-width 0.2s ease;

      &.collapsed {
        width: 64px;
        min-width: 64px;

        .nav-item { justify-content: center; padding: 12px 0; }
      }
    }

    nav { display: flex; flex-direction: column; gap: 2px; padding: 0 8px; }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 16px;
      border-radius: 8px;
      color: #424242;
      font-size: 14px;
      font-weight: 500;
      text-decoration: none;
      transition: background-color 0.15s;

      &:hover { background: #f5f5f5; }
      &.active {
        background: #e8eaf6;
        color: #3f51b5;
        mat-icon { color: #3f51b5; }
      }

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: #757575;
      }
    }

    .main-content {
      flex: 1;
      overflow-y: auto;
      background: #f5f5f5;
    }
  `],
})
export class LayoutComponent {
  sidebarCollapsed = signal(false);

  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard', active: false },
    { label: 'Projects', icon: 'folder', route: '/projects', active: false },
    { label: 'My Work', icon: 'assignment_ind', route: '/my-work', active: false },
    { label: 'Backlog', icon: 'list', route: '/backlog', active: false },
    { label: 'Board', icon: 'view_kanban', route: '/board', active: false },
    { label: 'Sprints', icon: 'speed', route: '/sprints', active: false },
    { label: 'Reports', icon: 'bar_chart', route: '/reports', active: false },
    { label: 'Settings', icon: 'settings', route: '/settings', active: false },
  ];

  constructor(public authService: AuthService) {}

  toggleSidebar(): void {
    this.sidebarCollapsed.update((v) => !v);
  }
}
