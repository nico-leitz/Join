import {
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import {
  ActivatedRoute,
  Router,
} from '@angular/router';
import {
  Task,
  TaskStatus,
} from '../../../../core/models/task.model';
import { Header } from '../../../../layout/header/header';
import { Sidebar } from '../../../../layout/sidebar/sidebar';
import { AddTaskContent } from '../../components/add-task-content/add-task-content';

@Component({
  selector: 'app-add-task-page',
  imports: [
    AddTaskContent,
    Header,
    Sidebar,
  ],
  templateUrl: './add-task-page.html',
  styleUrl: './add-task-page.scss',
})
export class AddTaskPage
  implements OnInit, OnDestroy
{
  private readonly redirectDelayMs = 800;

  private readonly route =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);

  private redirectTimerId:
    number | undefined;

  readonly taskStatus =
    signal<TaskStatus>('todo');

  ngOnInit(): void {
    this.initializeTaskStatus();
  }

  ngOnDestroy(): void {
    this.clearRedirectTimer();
  }

  protected handleTaskCreated(
    _task: Task,
  ): void {
    this.clearRedirectTimer();

    this.redirectTimerId =
      window.setTimeout(
        () => {
          void this.router.navigate([
            '/board',
          ]);
        },
        this.redirectDelayMs,
      );
  }

  private initializeTaskStatus(): void {
    const status =
      this.route.snapshot
        .queryParamMap
        .get('status');

    if (!isTaskStatus(status)) {
      return;
    }

    this.taskStatus.set(status);
  }

  private clearRedirectTimer(): void {
    if (
      this.redirectTimerId === undefined
    ) {
      return;
    }

    window.clearTimeout(
      this.redirectTimerId,
    );

    this.redirectTimerId = undefined;
  }
}

function isTaskStatus(
  value: string | null,
): value is TaskStatus {
  return (
    value === 'todo' ||
    value === 'in_progress' ||
    value === 'awaiting_feedback' ||
    value === 'done'
  );
}