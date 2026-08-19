import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/layout.component').then((m) => m.LayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'projects',
        loadComponent: () =>
          import('./features/projects/project-list/project-list.component').then(
            (m) => m.ProjectListComponent,
          ),
      },
      {
        path: 'projects/:id',
        loadComponent: () =>
          import('./features/projects/project-overview/project-overview.component').then(
            (m) => m.ProjectOverviewComponent,
          ),
      },
      {
        path: 'projects/:id/settings',
        loadComponent: () =>
          import('./features/projects/project-settings/project-settings.component').then(
            (m) => m.ProjectSettingsComponent,
          ),
      },
      {
        path: 'projects/:id/board',
        loadComponent: () =>
          import('./features/issues/board/board.component').then(
            (m) => m.BoardComponent,
          ),
      },
      {
        path: 'issues/:id',
        loadComponent: () =>
          import('./features/issues/issue-detail/issue-detail.component').then(
            (m) => m.IssueDetailComponent,
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings.component').then((m) => m.SettingsComponent),
      },
      {
        path: 'my-work',
        loadComponent: () =>
          import('./features/placeholder/placeholder.component').then(
            (m) => m.PlaceholderComponent,
          ),
        data: { title: 'My Work', icon: 'assignment_ind' },
      },
      {
        path: 'backlog',
        loadComponent: () =>
          import('./features/placeholder/placeholder.component').then(
            (m) => m.PlaceholderComponent,
          ),
        data: { title: 'Backlog', icon: 'list' },
      },
      {
        path: 'board',
        loadComponent: () =>
          import('./features/placeholder/placeholder.component').then(
            (m) => m.PlaceholderComponent,
          ),
        data: { title: 'Board', icon: 'view_kanban' },
      },
      {
        path: 'sprints',
        loadComponent: () =>
          import('./features/placeholder/placeholder.component').then(
            (m) => m.PlaceholderComponent,
          ),
        data: { title: 'Sprints', icon: 'speed' },
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/placeholder/placeholder.component').then(
            (m) => m.PlaceholderComponent,
          ),
        data: { title: 'Reports', icon: 'bar_chart' },
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
