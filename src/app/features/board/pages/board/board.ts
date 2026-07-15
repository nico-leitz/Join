import { Component, signal } from '@angular/core';
import { TaskCard } from "../../components/task-card/task-card";
import { BoardCardsDialog } from '../../../tasks/components/board-cards-dialog/board-cards-dialog';

@Component({
  selector: 'app-board',
  imports: [TaskCard, BoardCardsDialog],
  templateUrl: './board.html',
  styleUrl: './board.scss',
})
export class Board {
  isDialogOpen = signal(false);

  openDialog(): void {
    this.isDialogOpen.set(true);
  }

  closeDialog(): void {
    this.isDialogOpen.set(false);
  }
}
