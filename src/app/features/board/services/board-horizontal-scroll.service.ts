import type { DropListOrientation } from '@angular/cdk/drag-drop';
import { Injectable, OnDestroy, signal } from '@angular/core';

@Injectable()
export class BoardHorizontalScrollService implements OnDestroy {
  private readonly mobileMaxWidth = 798;
  private readonly horizontalLayoutMaxWidth = 1120;
  private readonly moveThreshold = 5;
  private scrollElement: HTMLElement | null = null;
  private pointerId: number | null = null;
  private startX = 0;
  private startLeft = 0;
  private moved = false;
  private pointerCaptured = false;
  private suppressCardClick = false;
  private suppressClickTimer: number | null = null;

  readonly isMobileViewport = signal(this.checkMobileViewport());
  readonly dropListOrientation = signal<DropListOrientation>(
    this.getDropListOrientation(),
  );

  ngOnDestroy(): void {
    this.clearSuppressClickTimer();
    this.reset();
  }

  updateViewport(): void {
    this.isMobileViewport.set(this.checkMobileViewport());
    this.dropListOrientation.set(this.getDropListOrientation());

    if (!this.isMobileViewport()) {
      this.reset();
    }
  }

  start(event: PointerEvent, isDragging: boolean): void {
    if (!this.canStart(event, isDragging)) {
      return;
    }

    const target = event.target;

    if (!(target instanceof Element) || this.isInteractiveTarget(target)) {
      return;
    }

    const element = target.closest<HTMLElement>(
      '.board__column_content',
    );

    if (!element || element.scrollWidth <= element.clientWidth) {
      return;
    }

    this.scrollElement = element;
    this.pointerId = event.pointerId;
    this.startX = event.clientX;
    this.startLeft = element.scrollLeft;
    this.moved = false;
    this.pointerCaptured = false;
  }

  move(event: PointerEvent): void {
    if (!this.matchesActivePointer(event)) {
      return;
    }

    const distance = event.clientX - this.startX;

    if (
      !this.moved &&
      Math.abs(distance) < this.moveThreshold
    ) {
      return;
    }

    if (!this.moved) {
      this.startMouseScroll(event);
    }

    event.preventDefault();
    this.scrollElement!.scrollLeft =
      this.startLeft - distance;
  }

  end(event: PointerEvent): void {
    if (!this.matchesActivePointer(event)) {
      return;
    }

    if (this.moved) {
      this.temporarilySuppressCardClick();
    }

    this.releasePointer(event);
    this.reset();
  }

  consumeSuppressedCardClick(): boolean {
    if (!this.suppressCardClick) {
      return false;
    }

    this.suppressCardClick = false;
    return true;
  }

  private canStart(
    event: PointerEvent,
    isDragging: boolean,
  ): boolean {
    return (
      this.isMobileViewport() &&
      event.pointerType === 'mouse' &&
      event.button === 0 &&
      !isDragging
    );
  }

  private isInteractiveTarget(
    target: Element,
  ): boolean {
    return Boolean(
      target.closest(
        'button, input, select, textarea, a, label',
      ),
    );
  }

  private matchesActivePointer(
    event: PointerEvent,
  ): boolean {
    return Boolean(
      this.scrollElement &&
      this.pointerId === event.pointerId,
    );
  }

  private startMouseScroll(
    event: PointerEvent,
  ): void {
    this.moved = true;
    this.scrollElement!.classList.add(
      'board__column_content--mouse-dragging',
    );
    this.scrollElement!.setPointerCapture(
      event.pointerId,
    );
    this.pointerCaptured = true;
  }

  private releasePointer(
    event: PointerEvent,
  ): void {
    if (
      this.scrollElement &&
      this.pointerCaptured &&
      this.scrollElement.hasPointerCapture(
        event.pointerId,
      )
    ) {
      this.scrollElement.releasePointerCapture(
        event.pointerId,
      );
    }
  }

  private temporarilySuppressCardClick(): void {
    this.suppressCardClick = true;
    this.clearSuppressClickTimer();
    this.suppressClickTimer = window.setTimeout(
      () => {
        this.suppressCardClick = false;
        this.suppressClickTimer = null;
      },
    );
  }

  private clearSuppressClickTimer(): void {
    if (this.suppressClickTimer !== null) {
      window.clearTimeout(
        this.suppressClickTimer,
      );
      this.suppressClickTimer = null;
    }
  }

  private reset(): void {
    this.scrollElement?.classList.remove(
      'board__column_content--mouse-dragging',
    );
    this.scrollElement = null;
    this.pointerId = null;
    this.startX = 0;
    this.startLeft = 0;
    this.moved = false;
    this.pointerCaptured = false;
  }

  private checkMobileViewport(): boolean {
    return (
      typeof window !== 'undefined' &&
      window.innerWidth <= this.mobileMaxWidth
    );
  }

  private getDropListOrientation():
    DropListOrientation {
    const isHorizontalLayout =
      typeof window !== 'undefined' &&
      window.innerWidth <=
        this.horizontalLayoutMaxWidth;

    return isHorizontalLayout
      ? 'horizontal'
      : 'vertical';
  }
}