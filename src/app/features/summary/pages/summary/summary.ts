import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Task } from '../../../../core/models/task.model';
import { AuthService } from '../../../../core/services/auth.service';
import { TaskService } from '../../../../core/services/task.service';
import { Header } from '../../../../layout/header/header';
import { Sidebar } from '../../../../layout/sidebar/sidebar';

/**
 * Displays the authenticated user's task summary.
 *
 * Loads the current task collection and derives status counts, the next
 * deadline and time-dependent greeting state for desktop and mobile layouts.
 */
@Component({
  selector: 'app-summary',
  imports: [Sidebar, Header, RouterLink],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
})
export class Summary implements OnInit, OnDestroy {
  /** Service used to restore authentication and access the current user. */
  private readonly authService = inject(AuthService);

  /** Service used to load and expose the current task collection. */
  private readonly taskService = inject(TaskService);

  /** Numeric priority order used when tasks share the same due date. */
  private readonly priorityRank: Record<Task['priority'], number> = {
    urgent: 0,
    medium: 1,
    low: 2,
  };

  /** Formatter used to create the user-facing upcoming deadline. */
  private readonly deadlineFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  /** Current local date used by greeting and deadline calculations. */
  private readonly currentDate = signal(new Date());

  /** Identifier of the interval keeping time-dependent values current. */
  private clockTimer?: ReturnType<typeof window.setInterval>;

  /** Identifier of the timer starting the mobile greeting fade-out. */
  private greetingFadeTimer?: ReturnType<typeof window.setTimeout>;

  /** Identifier of the timer removing the mobile greeting. */
  private greetingHideTimer?: ReturnType<typeof window.setTimeout>;

  /** Indicates whether the mobile login greeting is rendered. */
  readonly showMobileGreeting = signal(false);

  /** Indicates whether the mobile login greeting is fading out. */
  readonly isMobileGreetingLeaving = signal(false);

  /** Complete task collection exposed by the task service. */
  readonly tasks = this.taskService.allTasks;

  /** Indicates whether the task collection is being loaded. */
  readonly isLoading = this.taskService.isLoading;

  /** User-facing task loading error exposed by the task service. */
  readonly errorMessage = this.taskService.errorMessage;

  /** Number of tasks currently in the to-do status. */
  readonly todoCount = computed(() => {
    return this.countTasksByStatus('todo');
  });

  /** Number of tasks currently in the done status. */
  readonly doneCount = computed(() => {
    return this.countTasksByStatus('done');
  });

  /** Number of tasks currently in the in-progress status. */
  readonly inProgressCount = computed(() => {
    return this.countTasksByStatus('in_progress');
  });

  /** Number of tasks currently awaiting feedback. */
  readonly awaitingFeedbackCount = computed(() => {
    return this.countTasksByStatus('awaiting_feedback');
  });

  /** Number of urgent tasks which are not completed. */
  readonly urgentCount = computed(() => {
    return this.activeUrgentTasks().length;
  });

  /** Earliest non-completed task with an upcoming due date. */
  readonly upcomingTask = computed(() => {
    return this.getNextDueTask();
  });

  /** Query parameters linking the deadline card to its upcoming task. */
  readonly upcomingTaskQueryParams = computed(() => {
    const task = this.upcomingTask();

    return task ? { taskId: task.id } : {};
  });

  /** Formatted deadline of the next upcoming task. */
  readonly upcomingDeadline = computed(() => {
    return this.resolveUpcomingDeadline();
  });

  /** Greeting matching the current local time of day. */
  readonly greetingText = computed(() => {
    return this.resolveGreeting(this.currentDate().getHours());
  });

  /** Display name of the authenticated non-anonymous user. */
  readonly greetingName = computed(() => {
    const user = this.authService.currentUser();

    if (!user || user.isAnonymous) {
      return '';
    }

    return user.fullName.trim();
  });

  /** Indicates whether a user name should be included in the greeting. */
  readonly showGreetingName = computed(() => {
    return this.greetingName().length > 0;
  });

  /**
   * Initializes the optional mobile greeting and the summary clock.
   */
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

    this.clearTimer(this.greetingFadeTimer, 'timeout');

    this.clearTimer(this.greetingHideTimer, 'timeout');
  }

  /**
   * Loads the task state from Supabase.
   * @returns A promise that resolves after the load attempt.
   */
  private async loadTasks(): Promise<void> {
    try {
      await this.taskService.getTasks();
    } catch (error) {
      console.error('Summary tasks could not be loaded.', error);
    }
  }

  /**
   * Counts tasks matching one board status.
   * @param status - Board status whose tasks should be counted.
   * @returns Number of tasks matching the supplied status.
   */
  private countTasksByStatus(status: Task['status']): number {
    return this.tasks().filter((task) => {
      return task.status === status;
    }).length;
  }

  /**
   * Returns urgent tasks which are not completed.
   * @returns Active tasks with urgent priority.
   */
  private activeUrgentTasks(): Task[] {
    return this.tasks().filter((task) => {
      return task.priority === 'urgent' && task.status !== 'done';
    });
  }

  /**
   * Resolves the earliest upcoming task deadline.
   * @returns Formatted deadline or fallback text when no task is upcoming.
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
   * @returns Earliest upcoming task or undefined when none exists.
   */
  private getNextDueTask(): Task | undefined {
    const today = this.toDateKey(this.currentDate());

    return this.tasks()
      .filter((task) => task.status !== 'done' && task.dueDate >= today)
      .sort((firstTask, secondTask) => this.compareByDueDateAndPriority(firstTask, secondTask))[0];
  }

  /**
   * Sorts by due date and uses priority as tie-breaker.
   * @param firstTask - First task participating in the comparison.
   * @param secondTask - Second task participating in the comparison.
   * @returns Negative, zero or positive order value for array sorting.
   */
  private compareByDueDateAndPriority(firstTask: Task, secondTask: Task): number {
    const dateComparison = firstTask.dueDate.localeCompare(secondTask.dueDate);

    return dateComparison !== 0
      ? dateComparison
      : this.priorityRank[firstTask.priority] - this.priorityRank[secondTask.priority];
  }

  /**
   * Formats an ISO date without a timezone shift.
   * @param dateValue - Date value expected in YYYY-MM-DD format.
   * @returns Formatted date or fallback text for an invalid value.
   */
  private formatDueDate(dateValue: string): string {
    const [year, month, day] = dateValue.split('-').map(Number);

    const date = new Date(year, month - 1, day);

    return Number.isNaN(date.getTime())
      ? 'No upcoming deadline'
      : this.deadlineFormatter.format(date);
  }

  /**
   * Creates a local YYYY-MM-DD comparison key.
   * @param date - Local date to convert.
   * @returns Date key formatted as YYYY-MM-DD.
   */
  private toDateKey(date: Date): string {
    const year = date.getFullYear();

    const month = `${date.getMonth() + 1}`.padStart(2, '0');

    const day = `${date.getDate()}`.padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  /**
   * Resolves the greeting for the current daypart.
   * @param hour - Current local hour in 24-hour format.
   * @returns Greeting matching the supplied hour.
   */
  private resolveGreeting(hour: number): string {
    if (hour < 12) {
      return 'Good morning';
    }

    return hour < 18 ? 'Good afternoon' : 'Good evening';
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
    const greetingMode = this.authService.consumeSummaryGreeting();

    if (!greetingMode || window.innerWidth > 1200) {
      return;
    }

    this.showMobileGreeting.set(true);
    this.scheduleMobileGreetingEnd();
  }

  /**
   * Fades and removes the mobile greeting.
   */
  private scheduleMobileGreetingEnd(): void {
    this.greetingFadeTimer = window.setTimeout(() => {
      this.isMobileGreetingLeaving.set(true);
    }, 1000);

    this.greetingHideTimer = window.setTimeout(() => {
      this.showMobileGreeting.set(false);
      this.isMobileGreetingLeaving.set(false);
    }, 1400);
  }

  /**
   * Clears one optional browser timer.
   * @param timer - Identifier of the timer to clear.
   * @param type - Browser timer type determining the clear operation.
   */
  private clearTimer(timer: number | undefined, type: 'interval' | 'timeout'): void {
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