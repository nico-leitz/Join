import { Component } from '@angular/core';
import { Sidebar } from '../../../../layout/sidebar/sidebar';

@Component({
  selector: 'app-board',
  imports: [Sidebar],
  templateUrl: './board.html',
  styleUrl: './board.scss',
})
export class Board {}
