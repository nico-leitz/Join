import { Routes } from '@angular/router';
import { Summary } from './features/summary/pages/summary/summary';
import { AddTask } from './features/tasks/pages/add-task/add-task';
import { Board } from './features/board/pages/board/board';
import { Contacts } from './features/contacts/pages/contacts/contacts';
import { AddTaskPage } from './features/add-task/pages/add-task-page/add-task-page';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'contacts',
    pathMatch: 'full',
  },
  {
    path: 'summary',
    component: Summary,
  },
  {
    path: 'add-task',
    component: AddTaskPage,
  },
  {
    path: 'board',
    component: Board,
  },
  {
    path: 'contacts',
    component: Contacts,
  },
  {
    path: '**',
    redirectTo: 'contacts',
  },
];