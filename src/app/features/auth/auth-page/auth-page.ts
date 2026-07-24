import { Component } from '@angular/core';
import { Login } from '../pages/login/login';

@Component({
  selector: 'app-auth-page',
  imports: [Login],
  templateUrl: './auth-page.html',
  styleUrl: './auth-page.scss',
})
export class AuthPage {}
