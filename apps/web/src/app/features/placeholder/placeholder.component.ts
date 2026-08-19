import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-placeholder',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatCardModule],
  template: `
    <div class="placeholder-page">
      <mat-card class="placeholder-card">
        <div class="placeholder-content">
          <mat-icon>{{ icon }}</mat-icon>
          <h2>{{ title }}</h2>
          <p>Coming in a future phase</p>
          <span class="phase-badge">Future Release</span>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    .placeholder-page {
      display: flex; align-items: center; justify-content: center;
      padding: 64px 24px; min-height: 60vh;
    }

    .placeholder-card { max-width: 400px; width: 100%; }

    .placeholder-content {
      display: flex; flex-direction: column; align-items: center;
      text-align: center; padding: 48px 24px;

      mat-icon {
        font-size: 64px; width: 64px; height: 64px;
        color: #bdbdbd; margin-bottom: 16px;
      }

      h2 { font-size: 22px; font-weight: 600; color: #424242; margin-bottom: 8px; }
      p { color: #9e9e9e; margin-bottom: 16px; }
    }

    .phase-badge {
      display: inline-block; padding: 4px 12px;
      border-radius: 16px; font-size: 12px; font-weight: 500;
      background: #fff3e0; color: #e65100;
    }
  `],
})
export class PlaceholderComponent {
  title: string;
  icon: string;

  constructor(private route: ActivatedRoute) {
    this.title = this.route.snapshot.data['title'] || 'Feature';
    this.icon = this.route.snapshot.data['icon'] || 'construction';
  }
}
