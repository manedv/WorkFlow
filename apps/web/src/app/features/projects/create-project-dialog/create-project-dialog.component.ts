import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProjectService } from '../../../core/services/project.service';
import { OrganizationService, Organization } from '../../../core/services/organization.service';
import { UserService, UserSummary } from '../../../core/services/user.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-create-project-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>Create Project</h2>
    <mat-dialog-content>
      <form class="dialog-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Project Name</mat-label>
          <input matInput [(ngModel)]="name" name="name" required placeholder="e.g. RemoteDesk" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Project Key</mat-label>
          <input
            matInput
            [(ngModel)]="key"
            name="key"
            required
            placeholder="e.g. RD"
            (input)="key = key.toUpperCase()"
            maxlength="10"
          />
          <mat-hint>2-10 uppercase letters/numbers</mat-hint>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput [(ngModel)]="description" name="description" rows="3"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Organization</mat-label>
          <mat-select [(ngModel)]="organizationId" name="organizationId" required>
            @for (org of organizations(); track org.id) {
              <mat-option [value]="org.id">{{ org.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Project Lead</mat-label>
          <mat-select [(ngModel)]="leadId" name="leadId">
            @for (user of users(); track user.id) {
              <mat-option [value]="user.id">{{ user.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        @if (errorMessage()) {
          <div class="error-message">{{ errorMessage() }}</div>
        }
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button
        mat-raised-button
        color="primary"
        (click)="submit()"
        [disabled]="saving()"
      >
        @if (saving()) {
          <mat-spinner diameter="18"></mat-spinner>
        } @else {
          Create
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form { display: flex; flex-direction: column; gap: 4px; min-width: 400px; }
    .full-width { width: 100%; }
    .error-message {
      color: #d32f2f; font-size: 13px; padding: 8px;
      background: #fde8e8; border-radius: 8px; text-align: center;
    }
  `],
})
export class CreateProjectDialogComponent implements OnInit {
  name = '';
  key = '';
  description = '';
  organizationId = '';
  leadId = '';

  organizations = signal<Organization[]>([]);
  users = signal<UserSummary[]>([]);
  saving = signal(false);
  errorMessage = signal('');

  constructor(
    private dialogRef: MatDialogRef<CreateProjectDialogComponent>,
    private projectService: ProjectService,
    private orgService: OrganizationService,
    private userService: UserService,
    private notification: NotificationService,
  ) {}

  ngOnInit(): void {
    this.orgService.getMyOrganizations().subscribe({
      next: (res) => {
        this.organizations.set(res.data);
        if (res.data.length === 1) {
          this.organizationId = res.data[0].id;
        }
      },
    });

    this.userService.getAll().subscribe({
      next: (res) => this.users.set(res.data),
    });
  }

  submit(): void {
    if (!this.name || !this.key || !this.organizationId) {
      this.errorMessage.set('Please fill in required fields');
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');

    this.projectService
      .create({
        name: this.name,
        key: this.key,
        description: this.description || undefined,
        organizationId: this.organizationId,
        leadId: this.leadId || undefined,
      })
      .subscribe({
        next: () => {
          this.notification.success('Project created successfully');
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.saving.set(false);
          this.errorMessage.set(err.error?.error?.message || 'Failed to create project');
        },
      });
  }
}
