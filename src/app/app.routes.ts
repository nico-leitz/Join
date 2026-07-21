import { Routes } from '@angular/router';
import { Summary } from './features/summary/pages/summary/summary';
import { AddTask } from './features/tasks/pages/add-task/add-task';
import { Board } from './features/board/pages/board/board';
import { Contacts } from './features/contacts/pages/contacts/contacts';
import { Login } from './features/auth/pages/login/login';
import { Signup } from './features/auth/pages/signup/signup';
import { Help } from './features/help/pages/help/help';
import { LegalNotice } from './features/legal/legal-notice/legal-notice';
import { PrivacyPolicy } from './features/legal/privacy-policy/privacy-policy';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'contacts',
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: Login,
  },
  {
    path: 'signup',
    component: Signup,
  },
  {
    path: 'summary',
    component: Summary,
  },
  {
    path: 'add-task',
    component: AddTask,
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
    path: 'legal-notice',
    component: LegalNotice,
  },
  {
    path: 'privacy-policy',
    component: PrivacyPolicy,
  },
  {
    path: 'help',
    component: Help,
  },
  {
    path: '**',
    redirectTo: 'contacts',
  },
];