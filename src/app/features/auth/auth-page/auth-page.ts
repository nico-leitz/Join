import { Component } from '@angular/core';
import { Login } from '../pages/login/login';
import { Signup } from '../pages/signup/signup';

@Component({
  selector: 'app-auth-page',
  imports: [Login, Signup],
  templateUrl: './auth-page.html',
  styleUrl: './auth-page.scss',
})
export class AuthPage {}
