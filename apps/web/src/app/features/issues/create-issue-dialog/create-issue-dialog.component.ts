import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { IssueService, CreateIssuePayload } from '../../../core/services/issue.service';
import { NotificationService } from '../../../core/services/notification.service';

export interface CreateIssueDialogData {
  projectId: string;
  members: { id: string; name: string; email: string; avatar: string | null }[];
}

@Component({
  selector: 'app-create-issue-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>Create Issue</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="issue-form">
        <mat-form-field appearance="outline">
          <mat-label>Issue Type</mat-label>
          <mat-select formControlName="type">
            @for (t of issueTypes; track t.value) {
              <mat-option [value]="t.value">
                <mat-icon class="type-icon" [style.color]="t.color">{{ t.icon }}</mat-icon>
                {{ t.label }}
              </mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Summary</mat-label>
          <input matInput formControlName="summary" placeholder="What needs to be done?">
          @if (form.get('summary')?.hasError('required') && form.get('summary')?.touched) {
            <mat-error>Summary is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="4" placeholder="Add a description..."></textarea>
        </mat-form-field>

        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Priority</mat-label>
            <mat-select formControlName="priority">
              @for (p of priorities; track p.value) {
                <mat-option [value]="p.value">
                  <mat-icon class="priority-icon" [style.color]="p.color">{{ p.icon }}</mat-icon>
                  {{ p.label }}
                </mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Assignee</mat-label>
            <mat-select formControlName="assigneeId">
              <mat-option [value]="null">Unassigned</mat-option>
              @for (member of data.members; track member.id) {
                <mat-option [value]="member.id">{{ member.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Story Points</mat-label>
            <input matInput type="number" formControlName="storyPoints" min="0">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Due Date</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="dueDate">
            <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
          </mat-form-field>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid || submitting" (click)="submit()">
        @if (submitting) {
          <mat-spinner diameter="20"></mat-spinner>
        } @else {
          Create Issue
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .issue-form {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 480px;
      padding-top: 8px;
    }

    .form-row {
      display: flex;
      gap: 12px;
      mat-form-field { flex: 1; }
    }

    .type-icon, .priority-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      margin-right: 8px;
      vertical-align: middle;
    }

    mat-dialog-content { max-height: 70vh; }
  `],
})
export class CreateIssueDialogComponent {
  form: FormGroup;
  submitting = false;

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
    private fb: FormBuilder,
    private issueService: IssueService,
    private notification: NotificationService,
    private dialogRef: MatDialogRef<CreateIssueDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CreateIssueDialogData,
  ) {
    this.form = this.fb.group({
      type: ['TASK'],
      summary: ['', Validators.required],
      description: [''],
      priority: ['MEDIUM'],
      assigneeId: [null],
      storyPoints: [null],
      dueDate: [null],
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.submitting = true;

    const val = this.form.value;
    const payload: CreateIssuePayload = {
      summary: val.summary,
      type: val.type,
      priority: val.priority,
    };

    if (val.description) payload.description = val.description;
    if (val.assigneeId) payload.assigneeId = val.assigneeId;
    if (val.storyPoints != null) payload.storyPoints = val.storyPoints;
    if (val.dueDate) payload.dueDate = new Date(val.dueDate).toISOString();

    this.issueService.create(this.data.projectId, payload).subscribe({
      next: (res) => {
        this.notification.success(`Issue ${res.data.issueKey} created`);
        this.dialogRef.close(res.data);
      },
      error: () => {
        this.notification.error('Failed to create issue');
        this.submitting = false;
      },
    });
  }
}
