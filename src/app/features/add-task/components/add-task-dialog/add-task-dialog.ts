import { DOCUMENT } from '@angular/common';
import {
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Task, TaskStatus } from '../../../../core/models/task.model';
import { AddTaskContent } from '../add-task-content/add-task-content';

/**
 * Manages the modal workflow for creating a task.
 *
 * The component controls page scroll locking, close animations, and the
 * success state shown after a task has been created.
 */
@Component({
  selector: 'app-add-task-dialog',
  imports: [AddTaskContent],
  templateUrl: './add-task-dialog.html',
  styleUrl: './add-task-dialog.scss',
})
export class AddTaskDialog implements OnInit, OnDestroy {
  /** Duration of the dialog closing animation in milliseconds. */
  private readonly closeAnimationMs = 200;

  /** Duration of the success state before closing in milliseconds. */
  private readonly successDisplayMs = 800;

  /** Browser document used to control page scrolling. */
  private readonly document = inject(DOCUMENT);

  /** Original body overflow value restored after closing. */
  private previousBodyOverflow = '';

  /** Original document overflow value restored after closing. */
  private previousHtmlOverflow = '';

  /** Identifier of the active close timeout. */
  private closeTimerId: number | undefined;

  /** Identifier of the active success timeout. */
  private successTimerId: number | undefined;

  /** Task waiting to be emitted after the dialog closes. */
  private createdTask: Task | null = null;

  /** Child component used to inspect the submission state. */
  @ViewChild(AddTaskContent)
  private addTaskContent?: AddTaskContent;

  /** Initial status assigned to the new task. */
  readonly status = input<TaskStatus>('todo');

  /** Emits when the dialog closes without a created task. */
  readonly dialogClosed = output<void>();

  /** Emits the created task after the success sequence finishes. */
  readonly taskCreated = output<Task>();

  /** Indicates whether the closing animation is active. */
  readonly isClosing = signal(false);

  /** Indicates whether task creation has completed. */
  readonly hasCreatedTask = signal(false);

  /** Locks page scrolling when the dialog initializes. */
  ngOnInit(): void {
    this.lockPageScroll();
  }

  /** Clears timers and restores page scrolling during destruction. */
  ngOnDestroy(): void {
    this.clearTimers();
    this.restorePageScroll();
  }

  /**
   * Prevents a click inside the dialog from reaching its overlay.
   * @param event - Click event raised by the dialog element.
   */
  protected handleDialogClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  /** Closes the dialog when its current state permits it. */
  protected closeDialog(): void {
    if (!this.canCloseDialog()) {
      return;
    }

    this.startCloseAnimation(() => {
      this.dialogClosed.emit();
    });
  }

  /**
   * Starts the success sequence for a newly created task.
   * @param task - Newly created task to emit after closing.
   */
  protected handleTaskCreated(task: Task): void {
    if (this.hasCreatedTask()) {
      return;
    }

    this.createdTask = task;
    this.hasCreatedTask.set(true);
    this.successTimerId = window.setTimeout(() => {
      this.finishSuccessfulCreation();
    }, this.successDisplayMs);
  }

  /**
   * Checks whether the dialog may begin closing.
   * @returns Whether no close, success, or submission flow is active.
   */
  private canCloseDialog(): boolean {
    return !this.isClosing() && !this.hasCreatedTask() && !this.addTaskContent?.isSubmitting();
  }

  /** Completes the success sequence and emits its resulting event. */
  private finishSuccessfulCreation(): void {
    this.startCloseAnimation(() => {
      if (!this.createdTask) {
        this.dialogClosed.emit();
        return;
      }

      this.taskCreated.emit(this.createdTask);
    });
  }

  /**
   * Starts the closing animation and schedules its completion.
   * @param finished - Callback invoked when the animation finishes.
   */
  private startCloseAnimation(finished: () => void): void {
    if (this.isClosing()) {
      return;
    }

    this.isClosing.set(true);
    this.closeTimerId = window.setTimeout(finished, this.closeAnimationMs);
  }

  /** Locks scrolling on the underlying page. */
  private lockPageScroll(): void {
    this.previousBodyOverflow = this.document.body.style.overflow;
    this.previousHtmlOverflow = this.document.documentElement.style.overflow;
    this.document.body.style.overflow = 'hidden';
    this.document.documentElement.style.overflow = 'hidden';
  }

  /** Restores the page scroll values captured during initialization. */
  private restorePageScroll(): void {
    this.document.body.style.overflow = this.previousBodyOverflow;
    this.document.documentElement.style.overflow = this.previousHtmlOverflow;
  }

  /** Clears every timer owned by the dialog. */
  private clearTimers(): void {
    if (this.closeTimerId !== undefined) {
      window.clearTimeout(this.closeTimerId);
    }

    if (this.successTimerId !== undefined) {
      window.clearTimeout(this.successTimerId);
    }
  }
}