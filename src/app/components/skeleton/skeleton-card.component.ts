import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-xl shadow-lg overflow-hidden animate-fadeIn">
      <!-- Image placeholder -->
      <div [class]="imageClass + ' skeleton'"></div>
      <!-- Content -->
      <div class="p-4 space-y-3">
        <div class="h-5 w-3/4 skeleton"></div>
        <div class="h-4 w-full skeleton"></div>
        <div class="h-4 w-2/3 skeleton"></div>
        <div *ngIf="showActions" class="flex gap-2 pt-2">
          <div class="h-10 flex-1 skeleton rounded-lg"></div>
          <div *ngIf="showSecondAction" class="h-10 flex-1 skeleton rounded-lg"></div>
        </div>
      </div>
    </div>
  `
})
export class SkeletonCardComponent {
  @Input() imageHeight = 'h-48';
  @Input() showActions = true;
  @Input() showSecondAction = false;

  get imageClass(): string {
    return `w-full ${this.imageHeight}`;
  }
}
