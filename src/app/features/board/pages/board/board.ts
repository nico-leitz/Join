import { Component, inject, signal, OnInit, computed } from '@angular/core';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
  CdkDrag,
  CdkDropList,
  CdkDropListGroup,
  CdkDragHandle,
} from '@angular/cdk/drag-drop';
import { TaskCard } from '../../components/task-card/task-card';
import { BoardCardsDialog } from '../../../tasks/components/board-cards-dialog/board-cards-dialog';
import { TaskService } from '../../../../core/services/task.service';
import { Task, TaskStatus } from '../../../../core/models/task.model';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [TaskCard, BoardCardsDialog, CdkDropListGroup, CdkDropList, CdkDrag, CdkDragHandle],
  templateUrl: './board.html',
  styleUrl: './board.scss',
})
export class Board implements OnInit {
  taskService = inject(TaskService);
  isDialogOpen = signal(false);

  todo = computed(() => this.taskService.allTasks().filter(t => t.status === 'todo'));
  inProgress = computed(() => this.taskService.allTasks().filter(t => t.status === 'in_progress'));
  awaitFeedback = computed(() => this.taskService.allTasks().filter(t => t.status === 'awaiting_feedback'));
  done = computed(() => this.taskService.allTasks().filter(t => t.status === 'done'));

  ngOnInit() {
    this.taskService.getTasks();
  }

  openDialog(): void {
    this.isDialogOpen.set(true);
  }

  closeDialog(): void {
    this.isDialogOpen.set(false);
  }

  async drop(event: CdkDragDrop<Task[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );

      const movedTask = event.container.data[event.currentIndex];
      const newStatus = event.container.id as TaskStatus;

      try {
        await this.taskService.updateTask(movedTask.id, { status: newStatus });
      } catch (error) {
        console.error(error);
      }
    }
  }
}