import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Task, TaskStatus } from '../../../../core/models/task.model';
import { Header } from '../../../../layout/header/header';
import { Sidebar } from '../../../../layout/sidebar/sidebar';
import { AddTaskContent } from '../../components/add-task-content/add-task-content';

/**
 * Displays the standalone task creation page.
 *
 * Reads an optional initial task status from the route and redirects
 * to the board after successful task creation.
 */
@Component({
  selector: 'app-add-task-page',
  imports: [AddTaskContent, Header, Sidebar],
  templateUrl: './add-task-page.html',
  styleUrl: './add-task-page.scss',
})
export class AddTaskPage implements OnInit, OnDestroy {
  /** Delay before redirecting to the board after task creation. */
  private readonly redirectDelayMs = 800;

  /** Current activated route used to read query parameters. */
  private readonly route = inject(ActivatedRoute);

  /** Router used to navigate to the board. */
  private readonly router = inject(Router);

  /** Identifier of the pending redirect timer. */
  private redirectTimerId: number | undefined;

  /** Initial status assigned to the newly created task. */
  readonly taskStatus = signal<TaskStatus>('todo');

  /**
   * Initializes the task status from the current route.
   */
  ngOnInit(): void {
    this.initializeTaskStatus();
  }

  /**
   * Clears a pending redirect when the page is destroyed.
   */
  ngOnDestroy(): void {
    this.clearRedirectTimer();
  }

  /**
   * Schedules navigation to the board after task creation.
   * @param _task - Task created by the task form.
   */
  protected handleTaskCreated(_task: Task): void {
    void _task;
    this.clearRedirectTimer();

    this.redirectTimerId = window.setTimeout(() => {
      void this.router.navigate(['/board']);
    }, this.redirectDelayMs);
  }

  /**
   * Applies a valid task status supplied through the route.
   */
  private initializeTaskStatus(): void {
    const status = this.route.snapshot.queryParamMap.get('status');

    if (!isTaskStatus(status)) {
      return;
    }

    this.taskStatus.set(status);
  }

  /**
   * Cancels and clears the pending board redirect.
   */
  private clearRedirectTimer(): void {
    if (this.redirectTimerId === undefined) {
      return;
    }

    window.clearTimeout(this.redirectTimerId);

    this.redirectTimerId = undefined;
  }
}

/**
 * Determines whether a route value is a supported task status.
 * @param value - Route query parameter value to validate.
 * @returns True when the value is a valid task status.
 */
function isTaskStatus(value: string | null): value is TaskStatus {
  return (
    value === 'todo' || value === 'in_progress' || value === 'awaiting_feedback' || value === 'done'
  );
}