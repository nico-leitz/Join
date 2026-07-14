import { Component } from '@angular/core';
import { TaskCard } from "../../components/task-card/task-card";

@Component({
  selector: 'app-board',
  imports: [TaskCard],
  templateUrl: './board.html',
  styleUrl: './board.scss',
})
export class Board {}
