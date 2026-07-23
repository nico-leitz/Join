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
import { Task } from '../../../../core/models/task.model';
import { TaskStatus } from '../../../../core/models/task.model';
import { AddTaskContent } from '../add-task-content/add-task-content';

/**
 * Component for a modal dialog that handles the creation of a new task.
 * 
 * @remarks
 * This component manages the lifecycle of the task creation process, including
 * scroll locking, animation timing for closing, and handling success states after task creation.
 * 
 * @public
 */
@Component({
  selector: 'app-add-task-dialog',
  imports: [AddTaskContent],
  templateUrl: './add-task-dialog.html',
  styleUrl: './add-task-dialog.scss',
})
export class AddTaskDialog implements OnInit, OnDestroy {
  /** @internal Duration of the dialog closing animation in milliseconds. */
  private readonly closeAnimationMs = 200;

  /** @internal Duration to display the success state before closing in milliseconds. */
  private readonly successDisplayMs = 800;

  /** @internal Reference to the browser document object. */
  private readonly document = inject(DOCUMENT);

  /** @internal Stores original body scroll state to restore after dialog closure. */
  private previousBodyOverflow = '';
  
  /** @internal Stores original html scroll state to restore after dialog closure. */
  private previousHtmlOverflow = '';

  /** @internal ID for the dialog close timeout. */
  private closeTimerId: number | undefined;

  /** @internal ID for the success state timeout. */
  private successTimerId: number | undefined;

  /** @internal Holds the reference to the newly created task. */
  private createdTask: Task | null = null;

  /** @internal Reference to the AddTaskContent child component. */
  @ViewChild(AddTaskContent)
  private addTaskContent?: AddTaskContent;

  /** The initial status for the new task. Defaults to 'todo'. */
  readonly status = input<TaskStatus>('todo');

  /** Event emitted when the dialog is closed. */
  readonly dialogClosed = output<void>();

  /** Event emitted when a new task has been successfully created. */
  readonly taskCreated = output<Task>();

  /** Signal tracking if the dialog is currently animating to close. */
  readonly isClosing = signal(false);

  /** Signal tracking if a task has been successfully created. */
  readonly hasCreatedTask = signal(false);

  /** @public Lifecycle hook: Initializes page scroll locking. */
  ngOnInit(): void {
    this.lockPageScroll();
  }

  /** @public Lifecycle hook: Cleans up timers and restores page scrolling. */
  ngOnDestroy(): void {
    this.clearTimers();
    this.restorePageScroll();
  }

  /**
   * Prevents click propagation from the dialog container.
   * @param event - The click mouse event.
   * @protected
   */
  protected handleDialogClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  /**
   * Closes the dialog if the state allows it.
   * @protected
   */
  protected closeDialog(): void {
    if (!this.canCloseDialog()) {
      return;
    }

    this.startCloseAnimation(() => {
      this.dialogClosed.emit();
    });
  }

  /**
   * Handles the successful creation of a task, triggering the success display timer.
   * @param task - The newly created task object.
   * @protected
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
   * Checks if the dialog is in a state that allows closing.
   * @returns True if the dialog can be closed, false otherwise.
   * @private
   */
  private canCloseDialog(): boolean {
    return (
      !this.isClosing() &&
      !this.hasCreatedTask() &&
      !this.addTaskContent?.isSubmitting()
    );
  }

  /**
   * Triggers the close animation after a successful task creation.
   * @private
   */
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
   * Starts the closing animation and executes the callback upon completion.
   * @param finished - Callback to execute when the animation completes.
   * @private
   */
  private startCloseAnimation(finished: () => void): void {
    if (this.isClosing()) {
      return;
    }

    this.isClosing.set(true);

    this.closeTimerId = window.setTimeout(finished, this.closeAnimationMs);
  }

  /** @internal Prevents scrolling on the underlying page. */
  private lockPageScroll(): void {
    this.previousBodyOverflow = this.document.body.style.overflow;
    this.previousHtmlOverflow = this.document.documentElement.style.overflow;

    this.document.body.style.overflow = 'hidden';
    this.document.documentElement.style.overflow = 'hidden';
  }

  /** @internal Restores previous page scroll state. */
  private restorePageScroll(): void {
    this.document.body.style.overflow = this.previousBodyOverflow;
    this.document.documentElement.style.overflow = this.previousHtmlOverflow;
  }

  /** @internal Clears all active dialog timers. */
  private clearTimers(): void {
    if (this.closeTimerId !== undefined) {
      window.clearTimeout(this.closeTimerId);
    }

    if (this.successTimerId !== undefined) {
      window.clearTimeout(this.successTimerId);
    }
  }
}