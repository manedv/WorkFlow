import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { SprintService } from '../../../core/services/sprint.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-create-sprint-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatDatepickerModule, MatNativeDateModule,
  ],
  template: `
    <h2 mat-dialog-title>Create Sprint</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="sprint-form">
        <mat-form-field appearance="outline">
          <mat-label>Sprint Name</mat-label>
          <input matInput formControlName="name" placeholder="Sprint 1">
          @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
            <mat-error>Name is required</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Goal</mat-label>
          <textarea matInput formControlName="goal" rows="3" placeholder="What do you want to achieve?"></textarea>
        </mat-form-field>
        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Start Date</mat-label>
            <input matInput [matDatepicker]="startPicker" formControlName="startDate">
            <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
            <mat-datepicker #startPicker></mat-datepicker>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>End Date</mat-label>
            <input matInput [matDatepicker]="endPicker" formControlName="endDate">
            <mat-datepicker-toggle matIconSuffix [for]="endPicker"></mat-datepicker-toggle>
            <mat-datepicker #endPicker></mat-datepicker>
          </mat-form-field>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="submit()">Create</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .sprint-form { display: flex; flex-direction: column; gap: 4px; min-width: 400px; padding-top: 8px; }
    .form-row { display: flex; gap: 12px; }
    .form-row mat-form-field { flex: 1; }
  `],
})
export class CreateSprintDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private sprintService: SprintService,
    private notification: NotificationService,
    private dialogRef: MatDialogRef<CreateSprintDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { projectId: string },
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      goal: [''],
      startDate: [null],
      endDate: [null],
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    const val = this.form.value;
    const payload: any = { name: val.name };
    if (val.goal) payload.goal = val.goal;
    if (val.startDate) payload.startDate = new Date(val.startDate).toISOString();
    if (val.endDate) payload.endDate = new Date(val.endDate).toISOString();

    this.sprintService.create(this.data.projectId, payload).subscribe({
      next: (res) => { this.notification.success('Sprint created'); this.dialogRef.close(res.data); },
      error: () => this.notification.error('Failed to create sprint'),
    });
  }
}
