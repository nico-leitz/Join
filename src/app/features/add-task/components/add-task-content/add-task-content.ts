import { Component } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

@Component({
  selector: 'app-add-task-content',
  imports: [ReactiveFormsModule],
  templateUrl: './add-task-content.html',
  styleUrl: './add-task-content.scss',
})
export class AddTaskContent {

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
  });

  newTaskSubmit(){
    this.taskForm.value
  }

  resetInputFields(){
    this.taskForm.reset()
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