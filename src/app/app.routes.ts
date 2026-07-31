import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { AddTaskPage } from './features/add-task/pages/add-task-page/add-task-page';
import { AuthPage } from './features/auth/auth-page/auth-page';
import { Login } from './features/auth/pages/login/login';
import { Signup } from './features/auth/pages/signup/signup';
import { Board } from './features/board/pages/board/board';
import { Contacts } from './features/contacts/pages/contacts/contacts';
import { Help } from './features/help/pages/help/help';
import { LegalNotice } from './features/legal/legal-notice/legal-notice';
import { PrivacyPolicy } from './features/legal/privacy-policy/privacy-policy';
import { Summary } from './features/summary/pages/summary/summary';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: '',
    component: AuthPage,
    children: [
      {
        path: 'login',
        component: Login,
      },
      {
        path: 'signup',
        component: Signup,
      },
    ],
  },
  {
    path: '',
    canActivateChild: [authGuard],
    children: [
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
        path: 'help',
        component: Help,
      },
    ],
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
    path: '**',
    redirectTo: 'contacts',
  },
];