import { Component } from '@angular/core';
import { Sidebar } from '../../../../layout/sidebar/sidebar';
import { Header } from "../../../../layout/header/header";

@Component({
  selector: 'app-summary',
  imports: [Sidebar, Header],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
})
export class Summary {}
