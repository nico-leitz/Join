import {
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Task } from '../../../../core/models/task.model';
import { AuthService } from '../../../../core/services/auth.service';
import { TaskService } from '../../../../core/services/task.service';
import { Header } from '../../../../layout/header/header';
import { Sidebar } from '../../../../layout/sidebar/sidebar';

@Component({
  selector: 'app-summary',
  imports: [Sidebar, Header, RouterLink],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
})
export class Summary implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly taskService = inject(TaskService);

  private readonly priorityRank: Record<
    Task['priority'],
    number
  > = {
    urgent: 0,
    medium: 1,
    low: 2,
  };

  private readonly deadlineFormatter =
    new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

  private readonly currentDate = signal(new Date());

  private clockTimer?: ReturnType<
    typeof window.setInterval
  >;

  private greetingFadeTimer?: ReturnType<
    typeof window.setTimeout
  >;

  private greetingHideTimer?: ReturnType<
    typeof window.setTimeout
  >;

  readonly showMobileGreeting = signal(false);

  readonly isMobileGreetingLeaving =
    signal(false);

  readonly tasks = this.taskService.allTasks;
  readonly isLoading = this.taskService.isLoading;

  readonly errorMessage =
    this.taskService.errorMessage;

  readonly todoCount = computed(() => {
    return this.countTasksByStatus('todo');
  });

  readonly doneCount = computed(() => {
    return this.countTasksByStatus('done');
  });

  readonly inProgressCount = computed(() => {
    return this.countTasksByStatus('in_progress');
  });

  readonly awaitingFeedbackCount = computed(() => {
    return this.countTasksByStatus(
      'awaiting_feedback',
    );
  });

  readonly urgentCount = computed(() => {
    return this.activeUrgentTasks().length;
  });

  readonly upcomingTask = computed(() => {
    return this.getNextDueTask();
  });

  readonly upcomingTaskQueryParams = computed(() => {
    const task = this.upcomingTask();

    return task
      ? { taskId: task.id }
      : {};
  });

  readonly upcomingDeadline = computed(() => {
    return this.resolveUpcomingDeadline();
  });

  readonly greetingText = computed(() => {
    return this.resolveGreeting(
      this.currentDate().getHours(),
    );
  });

  readonly greetingName = computed(() => {
    const user = this.authService.currentUser();

    if (!user || user.isAnonymous) {
      return '';
    }

    return user.fullName.trim();
  });

  readonly showGreetingName = computed(() => {
    return this.greetingName().length > 0;
  });

  constructor() {
    this.initializeMobileGreeting();
    this.startClock();
  }

  /**
   * Restores auth state and loads the current tasks.
   */
  ngOnInit(): void {
    void this.authService.initialize();
    void this.loadTasks();
  }

  /**
   * Clears every timer created by the summary page.
   */
  ngOnDestroy(): void {
    this.clearTimer(this.clockTimer, 'interval');

    this.clearTimer(
      this.greetingFadeTimer,
      'timeout',
    );

    this.clearTimer(
      this.greetingHideTimer,
      'timeout',
    );
  }

  /**
   * Loads the task state from Supabase.
   */
  private async loadTasks(): Promise<void> {
    try {
      await this.taskService.getTasks();
    } catch (error) {
      console.error(
        'Summary tasks could not be loaded.',
        error,
      );
    }
  }

  /**
   * Counts tasks matching one board status.
   */
  private countTasksByStatus(
    status: Task['status'],
  ): number {
    return this.tasks().filter((task) => {
      return task.status === status;
    }).length;
  }

  /**
   * Returns urgent tasks which are not completed.
   */
  private activeUrgentTasks(): Task[] {
    return this.tasks().filter((task) => {
      return (
        task.priority === 'urgent' &&
        task.status !== 'done'
      );
    });
  }

  /**
   * Resolves the earliest upcoming task deadline.
   */
  private resolveUpcomingDeadline(): string {
    const task = this.upcomingTask();

    if (!task) {
      return 'No upcoming deadline';
    }

    return this.formatDueDate(task.dueDate);
  }

  /**
   * Finds the next non-completed task due.
   */
  private getNextDueTask(): Task | undefined {
    const today = this.toDateKey(this.currentDate());

    return this.tasks()
      .filter((task) => {
        return (
          task.status !== 'done' &&
          task.dueDate >= today
        );
      })
      .sort((firstTask, secondTask) => {
        return this.compareByDueDateAndPriority(
          firstTask,
          secondTask,
        );
      })[0];
  }

  /**
   * Sorts by due date and uses priority as tie-breaker.
   */
  private compareByDueDateAndPriority(
    firstTask: Task,
    secondTask: Task,
  ): number {
    const dateComparison =
      firstTask.dueDate.localeCompare(
        secondTask.dueDate,
      );

    return dateComparison !== 0
      ? dateComparison
      : this.priorityRank[firstTask.priority] -
          this.priorityRank[secondTask.priority];
  }

  /**
   * Formats an ISO date without a timezone shift.
   */
  private formatDueDate(dateValue: string): string {
    const [year, month, day] = dateValue
      .split('-')
      .map(Number);

    const date = new Date(year, month - 1, day);

    return Number.isNaN(date.getTime())
      ? 'No upcoming deadline'
      : this.deadlineFormatter.format(date);
  }

  /**
   * Creates a local YYYY-MM-DD comparison key.
   */
  private toDateKey(date: Date): string {
    const year = date.getFullYear();

    const month = `${date.getMonth() + 1}`.padStart(
      2,
      '0',
    );

    const day = `${date.getDate()}`.padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  /**
   * Resolves the greeting for the current daypart.
   */
  private resolveGreeting(hour: number): string {
    if (hour < 12) {
      return 'Good morning';
    }

    return hour < 18
      ? 'Good afternoon'
      : 'Good evening';
  }

  /**
   * Keeps time-dependent summary values current.
   */
  private startClock(): void {
    this.clockTimer = window.setInterval(() => {
      this.currentDate.set(new Date());
    }, 60_000);
  }

  /**
   * Starts the queued mobile login greeting.
   */
  private initializeMobileGreeting(): void {
    const greetingMode =
      this.authService.consumeSummaryGreeting();

    if (
      !greetingMode ||
      window.innerWidth > 1200
    ) {
      return;
    }

    this.showMobileGreeting.set(true);
    this.scheduleMobileGreetingEnd();
  }

  /**
   * Fades and removes the mobile greeting.
   */
  private scheduleMobileGreetingEnd(): void {
    this.greetingFadeTimer = window.setTimeout(
      () => {
        this.isMobileGreetingLeaving.set(true);
      },
      1000,
    );

    this.greetingHideTimer = window.setTimeout(
      () => {
        this.showMobileGreeting.set(false);
        this.isMobileGreetingLeaving.set(false);
      },
      1400,
    );
  }

  /**
   * Clears one optional browser timer.
   */
  private clearTimer(
    timer: number | undefined,
    type: 'interval' | 'timeout',
  ): void {
    if (timer === undefined) {
      return;
    }

    if (type === 'interval') {
      window.clearInterval(timer);
      return;
    }

    window.clearTimeout(timer);
  }
}