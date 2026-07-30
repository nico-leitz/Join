import type { DropListOrientation } from '@angular/cdk/drag-drop';
import {
  Injectable,
  OnDestroy,
  signal,
} from '@angular/core';

/**
 * Provides mouse-based horizontal scrolling for narrow board columns.
 *
 * Tracks one active mouse pointer and suppresses the card click generated
 * after a successful scrolling gesture.
 */
@Injectable()
export class BoardHorizontalScrollService
  implements OnDestroy
{
  /** Maximum viewport width using the mobile board behavior. */
  private readonly mobileMaxWidth =
    798;

  /** Maximum viewport width using horizontal CDK drop lists. */
  private readonly horizontalLayoutMaxWidth =
    1120;

  /** Minimum horizontal movement recognized as a scroll gesture. */
  private readonly moveThreshold =
    5;

  /** Board column currently controlled by the mouse pointer. */
  private scrollElement:
    HTMLElement | null = null;

  /** Identifier of the active scrolling pointer. */
  private pointerId:
    number | null = null;

  /** Initial horizontal pointer position. */
  private startX = 0;

  /** Initial scroll offset of the active board column. */
  private startLeft = 0;

  /** Indicates whether the pointer exceeded the movement threshold. */
  private moved = false;

  /** Indicates whether the active element captured the pointer. */
  private pointerCaptured =
    false;

  /** Indicates whether the next task card click should be ignored. */
  private suppressCardClick =
    false;

  /** Identifier of the pending click suppression timer. */
  private suppressClickTimer:
    number | null = null;

  /** Indicates whether the mobile board behavior is active. */
  readonly isMobileViewport =
    signal(
      this.checkMobileViewport(),
    );

  /** Orientation used by the board CDK drop lists. */
  readonly dropListOrientation =
    signal<DropListOrientation>(
      this.getDropListOrientation(),
    );

  /**
   * Clears timers and active pointer state.
   */
  ngOnDestroy(): void {
    this.clearSuppressClickTimer();
    this.reset();
  }

  /**
   * Recalculates responsive board state after a viewport change.
   */
  updateViewport(): void {
    this.isMobileViewport.set(
      this.checkMobileViewport(),
    );

    this.dropListOrientation.set(
      this.getDropListOrientation(),
    );

    if (
      !this.isMobileViewport()
    ) {
      this.reset();
    }
  }

  /**
   * Starts tracking a possible mouse scrolling gesture.
   *
   * @param event - Pointer event raised on the board.
   * @param isDragging - Whether a CDK task drag is already active.
   */
  start(
    event: PointerEvent,
    isDragging: boolean,
  ): void {
    if (
      !this.canStart(
        event,
        isDragging,
      )
    ) {
      return;
    }

    const target = event.target;

    if (
      !(target instanceof Element) ||
      this.isInteractiveTarget(
        target,
      )
    ) {
      return;
    }

    const element =
      target.closest<HTMLElement>(
        '.board__column_content',
      );

    if (
      !element ||
      element.scrollWidth <=
        element.clientWidth
    ) {
      return;
    }

    this.scrollElement =
      element;

    this.pointerId =
      event.pointerId;

    this.startX =
      event.clientX;

    this.startLeft =
      element.scrollLeft;

    this.moved = false;
    this.pointerCaptured = false;
  }

  /**
   * Scrolls the active board column after the movement threshold is met.
   *
   * @param event - Current pointer move event.
   */
  move(
    event: PointerEvent,
  ): void {
    if (
      !this.matchesActivePointer(
        event,
      )
    ) {
      return;
    }

    const distance =
      event.clientX -
      this.startX;

    if (
      !this.moved &&
      Math.abs(distance) <
        this.moveThreshold
    ) {
      return;
    }

    if (!this.moved) {
      this.startMouseScroll(
        event,
      );
    }

    event.preventDefault();

    this.scrollElement!
      .scrollLeft =
        this.startLeft -
        distance;
  }

  /**
   * Finishes the active scrolling gesture.
   *
   * @param event - Pointer end or cancellation event.
   */
  end(
    event: PointerEvent,
  ): void {
    if (
      !this.matchesActivePointer(
        event,
      )
    ) {
      return;
    }

    if (this.moved) {
      this.temporarilySuppressCardClick();
    }

    this.releasePointer(event);
    this.reset();
  }

  /**
   * Consumes the click suppression flag after a scrolling gesture.
   *
   * @returns True when the current card click should be ignored.
   */
  consumeSuppressedCardClick():
    boolean
  {
    if (!this.suppressCardClick) {
      return false;
    }

    this.suppressCardClick =
      false;

    return true;
  }

  /**
   * Checks whether the pointer may start mobile column scrolling.
   *
   * @param event - Pointer event to inspect.
   * @param isDragging - Whether a CDK task drag is active.
   * @returns True for an eligible primary mouse pointer.
   */
  private canStart(
    event: PointerEvent,
    isDragging: boolean,
  ): boolean {
    return (
      this.isMobileViewport() &&
      event.pointerType ===
        'mouse' &&
      event.button === 0 &&
      !isDragging
    );
  }

  /**
   * Checks whether an element belongs to an interactive control.
   *
   * @param target - Event target to inspect.
   * @returns True when column scrolling must not start from the target.
   */
  private isInteractiveTarget(
    target: Element,
  ): boolean {
    return Boolean(
      target.closest(
        'button, input, select, textarea, a, label',
      ),
    );
  }

  /**
   * Checks whether an event belongs to the active pointer gesture.
   *
   * @param event - Pointer event to inspect.
   * @returns True when the pointer and scroll element are active.
   */
  private matchesActivePointer(
    event: PointerEvent,
  ): boolean {
    return Boolean(
      this.scrollElement &&
      this.pointerId ===
        event.pointerId,
    );
  }

  /**
   * Activates scrolling and captures the current pointer.
   *
   * @param event - Pointer event that exceeded the movement threshold.
   */
  private startMouseScroll(
    event: PointerEvent,
  ): void {
    this.moved = true;

    this.scrollElement!
      .classList
      .add(
        'board__column_content--mouse-dragging',
      );

    this.scrollElement!
      .setPointerCapture(
        event.pointerId,
      );

    this.pointerCaptured = true;
  }

  /**
   * Releases pointer capture when the active element still owns it.
   *
   * @param event - Pointer end event containing the active identifier.
   */
  private releasePointer(
    event: PointerEvent,
  ): void {
    if (
      this.scrollElement &&
      this.pointerCaptured &&
      this.scrollElement
        .hasPointerCapture(
          event.pointerId,
        )
    ) {
      this.scrollElement
        .releasePointerCapture(
          event.pointerId,
        );
    }
  }

  /**
   * Suppresses the click emitted immediately after mouse scrolling.
   */
  private temporarilySuppressCardClick(): void {
    this.suppressCardClick =
      true;

    this.clearSuppressClickTimer();

    this.suppressClickTimer =
      window.setTimeout(() => {
        this.suppressCardClick =
          false;

        this.suppressClickTimer =
          null;
      });
  }

  /**
   * Cancels and clears the pending click suppression timer.
   */
  private clearSuppressClickTimer(): void {
    if (
      this.suppressClickTimer ===
      null
    ) {
      return;
    }

    window.clearTimeout(
      this.suppressClickTimer,
    );

    this.suppressClickTimer =
      null;
  }

  /**
   * Removes gesture styling and clears active pointer state.
   */
  private reset(): void {
    this.scrollElement
      ?.classList
      .remove(
        'board__column_content--mouse-dragging',
      );

    this.scrollElement = null;
    this.pointerId = null;
    this.startX = 0;
    this.startLeft = 0;
    this.moved = false;
    this.pointerCaptured = false;
  }

  /**
   * Checks whether the current viewport uses mobile board behavior.
   *
   * @returns True when the viewport width is within the mobile breakpoint.
   */
  private checkMobileViewport():
    boolean
  {
    return (
      typeof window !==
        'undefined' &&
      window.innerWidth <=
        this.mobileMaxWidth
    );
  }

  /**
   * Resolves the CDK drop-list orientation for the current viewport.
   *
   * @returns Horizontal orientation for narrow layouts, otherwise vertical.
   */
  private getDropListOrientation():
    DropListOrientation
  {
    const isHorizontalLayout =
      typeof window !==
        'undefined' &&
      window.innerWidth <=
        this.horizontalLayoutMaxWidth;

    return isHorizontalLayout
      ? 'horizontal'
      : 'vertical';
  }
}