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

@Component({
  selector: 'app-add-task-dialog',
  imports: [AddTaskContent],
  templateUrl: './add-task-dialog.html',
  styleUrl: './add-task-dialog.scss',
})
export class AddTaskDialog
  implements OnInit, OnDestroy
{
  private readonly closeAnimationMs = 200;
  private readonly successDisplayMs = 800;

  private readonly document = inject(DOCUMENT);

  private previousBodyOverflow = '';
  private previousHtmlOverflow = '';

  private closeTimerId:
    number | undefined;

  private successTimerId:
    number | undefined;

  private createdTask:
    Task | null = null;

  @ViewChild(AddTaskContent)
  private addTaskContent?:
    AddTaskContent;

  readonly status =
    input<TaskStatus>('todo');

  readonly dialogClosed =
    output<void>();

  readonly taskCreated =
    output<Task>();

  readonly isClosing =
    signal(false);

  readonly hasCreatedTask =
    signal(false);

  ngOnInit(): void {
    this.lockPageScroll();
  }

  ngOnDestroy(): void {
    this.clearTimers();
    this.restorePageScroll();
  }

  protected handleDialogClick(
    event: MouseEvent,
  ): void {
    event.stopPropagation();
  }

  protected closeDialog(): void {
    if (!this.canCloseDialog()) {
      return;
    }

    this.startCloseAnimation(
      () => {
        this.dialogClosed.emit();
      },
    );
  }

  protected handleTaskCreated(
    task: Task,
  ): void {
    if (this.hasCreatedTask()) {
      return;
    }

    this.createdTask = task;
    this.hasCreatedTask.set(true);

    this.successTimerId =
      window.setTimeout(
        () => {
          this.finishSuccessfulCreation();
        },
        this.successDisplayMs,
      );
  }

  private canCloseDialog(): boolean {
    return (
      !this.isClosing() &&
      !this.hasCreatedTask() &&
      !this.addTaskContent
        ?.isSubmitting()
    );
  }

  private finishSuccessfulCreation():
    void {
    this.startCloseAnimation(
      () => {
        if (!this.createdTask) {
          this.dialogClosed.emit();
          return;
        }

        this.taskCreated.emit(
          this.createdTask,
        );
      },
    );
  }

  private startCloseAnimation(
    finished: () => void,
  ): void {
    if (this.isClosing()) {
      return;
    }

    this.isClosing.set(true);

    this.closeTimerId =
      window.setTimeout(
        finished,
        this.closeAnimationMs,
      );
  }

  private lockPageScroll(): void {
    this.previousBodyOverflow =
      this.document.body.style.overflow;

    this.previousHtmlOverflow =
      this.document.documentElement
        .style.overflow;

    this.document.body.style.overflow =
      'hidden';

    this.document.documentElement
      .style.overflow = 'hidden';
  }

  private restorePageScroll(): void {
    this.document.body.style.overflow =
      this.previousBodyOverflow;

    this.document.documentElement
      .style.overflow =
      this.previousHtmlOverflow;
  }

  private clearTimers(): void {
    if (
      this.closeTimerId !== undefined
    ) {
      window.clearTimeout(
        this.closeTimerId,
      );
    }

    if (
      this.successTimerId !== undefined
    ) {
      window.clearTimeout(
        this.successTimerId,
      );
    }
  }
}