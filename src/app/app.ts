import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/** Hosts the application shell and routed page content. */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}