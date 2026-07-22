import { Component } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

@Component({
  selector: 'app-add-task-content',
  imports: [ReactiveFormsModule],
  templateUrl: './add-task-content.html',
  styleUrl: './add-task-content.scss',
})
export class AddTaskContent {

  selectedPriority: 'urgent' | 'medium' | 'low' = 'medium';

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