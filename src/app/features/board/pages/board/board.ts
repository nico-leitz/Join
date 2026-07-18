import { Component, signal } from '@angular/core';
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

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [TaskCard, BoardCardsDialog, CdkDropListGroup, CdkDropList, CdkDrag, CdkDragHandle],
  templateUrl: './board.html',
  styleUrl: './board.scss',
})
export class Board {
  isDialogOpen = signal(false);

  todo = ['Task 1', 'Task 2'];
  inProgress = ['Task 3'];
  awaitFeedback = ['Task 4'];
  done = ['Task 5'];

  openDialog(): void {
    this.isDialogOpen.set(true);
  }

  closeDialog(): void {
    this.isDialogOpen.set(false);
  }

  drop(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }
  }
}
