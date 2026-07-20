import { Component, input, output } from '@angular/core'; 
import { Task } from '../../../../core/models/task.model';

@Component({
  selector: 'app-task-card',
  imports: [],
  templateUrl: './task-card.html',
  styleUrl: './task-card.scss',
})
export class TaskCard {

  task = input.required<Task>(); 
  
  cardClick = output<void>();
}