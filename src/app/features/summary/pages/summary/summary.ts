import { Component, inject, OnDestroy, signal } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';
import { Sidebar } from '../../../../layout/sidebar/sidebar';
import { Header } from "../../../../layout/header/header";

@Component({
  selector: 'app-summary',
  imports: [Sidebar, Header],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
})
export class Summary implements OnDestroy {
  private readonly authService = inject(AuthService);

  readonly showMobileGreeting = signal(false);
  readonly showGreetingName = signal(false);
  readonly isMobileGreetingLeaving = signal(false);

  private greetingFadeTimer?: ReturnType<typeof window.setTimeout>;
  private greetingHideTimer?: ReturnType<typeof window.setTimeout>;

  constructor() {
    this.initializeMobileGreeting();
  }

  ngOnDestroy(): void {
    if (this.greetingFadeTimer) {
      window.clearTimeout(this.greetingFadeTimer);
    }

    if (this.greetingHideTimer) {
      window.clearTimeout(this.greetingHideTimer);
    }
  }

  private initializeMobileGreeting(): void {
    if (window.innerWidth > 1200) {
      return;
    }

    const greetingMode = this.authService.consumeSummaryGreeting();

    if (!greetingMode) {
      return;
    }

    this.showGreetingName.set(greetingMode === 'user');
    this.showMobileGreeting.set(true);
    this.isMobileGreetingLeaving.set(false);

    this.greetingFadeTimer = window.setTimeout(() => {
      this.isMobileGreetingLeaving.set(true);
    }, 1000);

    this.greetingHideTimer = window.setTimeout(() => {
      this.showMobileGreeting.set(false);
      this.isMobileGreetingLeaving.set(false);
    }, 1400);
  }
}
