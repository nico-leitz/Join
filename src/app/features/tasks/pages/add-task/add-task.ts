import { Component } from '@angular/core';
import { Sidebar } from '../../../../layout/sidebar/sidebar';

@Component({
  selector: 'app-add-task',
  imports: [Sidebar],
  templateUrl: './add-task.html',
  styleUrl: './add-task.scss',
})
export class AddTask {}
