import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

@Component({
  selector: 'app-add-task-content',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-task-content.html',
  styleUrl: './add-task-content.scss',
})
export class AddTaskContent {

  @ViewChild('categoryWrapper', { read: ElementRef })
  categoryWrapper?: ElementRef<HTMLElement>;

  selectedPriority: 'urgent' | 'medium' | 'low' = 'medium';
  categoryMenuOpen = false;
  categoryOptions = [
    { value: 'technical_task', label: 'Technical Task' },
    { value: 'user_story', label: 'User Story' },
  ];

  taskForm = new FormGroup({
    title : new FormControl('',{
      validators: [Validators.required]
  }),
    description:new FormControl('',{
      validators: []
  }),
    dueDate:new FormControl('',{
      validators: [Validators.required, dateNotInPastValidator()]
  }),
    assignedTo:new FormControl('',{
      validators: [Validators.required]
  }),
    category:new FormControl('',{
      validators: [Validators.required]
  }),
    subtasks:new FormControl('',{
      validators: [Validators.required]
  }),
    priority:new FormControl('medium'),
  });

  get categoryDisplayValue(): string {
    const categoryValue = this.taskForm.controls.category.value;
    return this.categoryOptions.find(option => option.value === categoryValue)?.label || '';
  }

  toggleCategoryMenu(): void {
    this.categoryMenuOpen = !this.categoryMenuOpen;
  }

  selectCategory(value: string, event: Event): void {
    event.stopPropagation();
    this.taskForm.controls.category.setValue(value);
    this.categoryMenuOpen = false;
  }

  @HostListener('document:click', ['$event.target'])
  closeCategoryMenu(target: EventTarget | null): void {
    if (target instanceof HTMLElement && !this.categoryWrapper?.nativeElement.contains(target)) {
      this.categoryMenuOpen = false;
    }
  }

  setPriority(priority: 'urgent' | 'medium' | 'low'){
    this.selectedPriority = priority;
    this.taskForm.controls.priority.setValue(priority);
  }

  newTaskSubmit(){
    this.taskForm.value
  }

  resetInputFields(){
    this.taskForm.reset({ priority: 'medium' });
    this.selectedPriority = 'medium';
    this.categoryMenuOpen = false;
  }
  
}

export function dateNotInPastValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) {
        return null;
      }

      const parsedDate = typeof value === 'string' ? new Date(value) : new Date(value);
      if (Number.isNaN(parsedDate.getTime())) {
        return { invalidDate: true };
      }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      return parsedDate < today ? { dateInPast: { value } } : null;
    };
}