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

/**
 * Handles board behavior controlled through route query parameters.
 */
@Injectable()
export class BoardRouteService {
  /** Current route used to read board query parameters. */
  private readonly route =
    inject(ActivatedRoute);

  /** Router used to remove handled query parameters. */
  private readonly router =
    inject(Router);

  /**
   * Returns the task requested through the current URL.
   *
   * @returns Requested task identifier or null when none was supplied.
   */
  getRequestedTaskId():
    string | null
  {
    return this.route.snapshot
      .queryParamMap
      .get('taskId');
  }

  /**
   * Removes the selected task identifier from the current URL.
   */
  clearRequestedTask(): void {
    if (
      !this.route.snapshot
        .queryParamMap
        .has('taskId')
    ) {
      return;
    }

    void this.router.navigate(
      [],
      {
        relativeTo: this.route,
        queryParams: {
          taskId: null,
        },
        queryParamsHandling:
          'merge',
        replaceUrl: true,
      },
    );
  }

  /**
   * Schedules scrolling to a valid board status requested through the URL.
   */
  scheduleRequestedStatusScroll(): void {
    const status =
      this.route.snapshot
        .queryParamMap
        .get('status');

    if (
      !status ||
      !isTaskStatus(status)
    ) {
      return;
    }

    window.requestAnimationFrame(
      () => {
        this.scrollToStatus(
          status,
        );
      },
    );
  }

  /**
   * Scrolls to a status when the board columns use the stacked layout.
   *
   * @param status - Status of the requested board column.
   */
  private scrollToStatus(
    status: TaskStatus,
  ): void {
    const target =
      document
        .getElementById(status)
        ?.closest<HTMLElement>(
          '.board__column',
        );

    if (
      target &&
      this.hasStackedColumns()
    ) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }

  /**
   * Checks whether the board columns are positioned below each other.
   *
   * @returns True when the first two columns have different vertical offsets.
   */
  private hasStackedColumns():
    boolean
  {
    const columns =
      document.querySelectorAll<HTMLElement>(
        '.board__column',
      );

    const firstColumn =
      columns.item(0);

    const secondColumn =
      columns.item(1);

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