import { Component } from '@angular/core';
import { AddTaskContent } from '../../components/add-task-content/add-task-content';
import { Header } from "../../../../layout/header/header";
import { Sidebar } from "../../../../layout/sidebar/sidebar";

@Component({
  selector: 'app-add-task-page',
  imports: [AddTaskContent, Sidebar, Header],
  templateUrl: './add-task-page.html',
  styleUrl: './add-task-page.scss',
})
export class AddTaskPage {}
