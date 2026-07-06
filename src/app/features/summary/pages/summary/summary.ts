import { Component } from '@angular/core';
import { Sidebar } from '../../../../layout/sidebar/sidebar';

@Component({
  selector: 'app-summary',
  imports: [Sidebar],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
})
export class Summary {}
