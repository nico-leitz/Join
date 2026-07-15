import { DOCUMENT } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, output, signal } from '@angular/core';

@Component({
  selector: 'app-board-cards-dialog',
  imports: [],
  templateUrl: './board-cards-dialog.html',
  styleUrl: './board-cards-dialog.scss',
})
export class BoardCardsDialog implements OnInit, OnDestroy {
  private readonly closeAnimationMs = 200;
  private document = inject(DOCUMENT);
  private previousBodyOverflow = '';
  private previousHtmlOverflow = '';
  private closeTimerId: number | undefined;

  dialogClosed = output<void>();
  isClosing = signal(false);

  ngOnInit(): void {
    this.previousBodyOverflow = this.document.body.style.overflow;
    this.previousHtmlOverflow = this.document.documentElement.style.overflow;
    this.document.body.style.overflow = 'hidden';
    this.document.documentElement.style.overflow = 'hidden';
  }

  ngOnDestroy(): void {
    if (this.closeTimerId !== undefined) {
      window.clearTimeout(this.closeTimerId);
    }

    this.document.body.style.overflow = this.previousBodyOverflow;
    this.document.documentElement.style.overflow = this.previousHtmlOverflow;
  }

  closeDialog(): void {
    if (this.isClosing()) {
      return;
    }

    this.isClosing.set(true);
    this.closeTimerId = window.setTimeout(() => this.dialogClosed.emit(), this.closeAnimationMs);
  }
}
