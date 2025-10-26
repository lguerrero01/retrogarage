import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-category-filter',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './category-filter.component.html',
  styleUrls: ['./category-filter.component.css']
})
export class CategoryFilterComponent {
  @Input() categories: string[] = [];
  @Input() selectedCategory = 'all';
  @Output() onCategoryChange = new EventEmitter<string>();

  private colors = [
    'bg-[#2a23b8] hover:bg-[#2a23b8]/90',
    'bg-[#ed450d] hover:bg-[#ed450d]/90',
    'bg-[#8624ce] hover:bg-[#8624ce]/90',
    'bg-[#e8065b] hover:bg-[#e8065b]/90',
    'bg-[#d01174] hover:bg-[#d01174]/90'
  ];

  getColorClass(index: number): string {
    return this.colors[index % this.colors.length];
  }
}