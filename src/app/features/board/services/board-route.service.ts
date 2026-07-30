import {
  Injectable,
  inject,
} from '@angular/core';
import {
  ActivatedRoute,
  Router,
} from '@angular/router';
import { isTaskStatus } from '../../../core/constants/task-status.constants';
import { TaskStatus } from '../../../core/models/task.model';

@Injectable()
export class BoardRouteService {
  private readonly route =
    inject(ActivatedRoute);

  private readonly router = inject(Router);

  /**
   * Returns the task ID requested through the current query parameters.
   */
  getRequestedTaskId(): string | null {
    return this.route.snapshot.queryParamMap.get(
      'taskId',
    );
  }

  /**
   * Removes the selected task from the current board URL.
   */
  clearRequestedTask(): void {
    if (
      !this.route.snapshot.queryParamMap.has(
        'taskId',
      )
    ) {
      return;
    }

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        taskId: null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  /**
   * Scrolls to the board status requested through the URL.
   */
  scheduleRequestedStatusScroll(): void {
    const status =
      this.route.snapshot.queryParamMap.get(
        'status',
      );

    if (!status || !isTaskStatus(status)) {
      return;
    }

    window.requestAnimationFrame(() => {
      this.scrollToStatus(status);
    });
  }

  /**
   * Scrolls only when the board columns use the stacked layout.
   */
  private scrollToStatus(
    status: TaskStatus,
  ): void {
    const target = document
      .getElementById(status)
      ?.closest<HTMLElement>(
        '.board__column',
      );

    if (target && this.hasStackedColumns()) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }

  /**
   * Checks whether the board columns are displayed below each other.
   */
  private hasStackedColumns(): boolean {
    const columns =
      document.querySelectorAll<HTMLElement>(
        '.board__column',
      );

    const firstColumn = columns.item(0);
    const secondColumn = columns.item(1);

    return Boolean(
      firstColumn &&
        secondColumn &&
        Math.abs(
          firstColumn.offsetTop -
            secondColumn.offsetTop,
        ) > 1,
    );
  }
}