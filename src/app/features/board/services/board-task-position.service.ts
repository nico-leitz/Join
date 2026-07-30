import {
  CdkDragDrop,
} from '@angular/cdk/drag-drop';
import {
  Injectable,
  inject,
  signal,
} from '@angular/core';
import {
  Task,
  TaskPositionUpdate,
  TaskStatus,
} from '../../../core/models/task.model';
import { TaskService } from '../../../core/services/task.service';
import {
  createDropTaskUpdates,
  createStatusMoveTaskUpdates,
} from '../../../core/utils/task-order.utils';

@Injectable()
export class BoardTaskPositionService {
  private readonly taskService =
    inject(TaskService);

  readonly isUpdating = signal(false);

  /**
   * Moves one task into another board status.
   */
  async moveToStatus(
    task: Task,
    targetStatus: TaskStatus,
  ): Promise<string> {
    if (this.isUpdating()) {
      return '';
    }

    const updates =
      createStatusMoveTaskUpdates(
        this.taskService.allTasks(),
        task.id,
        targetStatus,
      );

    return this.persist(updates);
  }

  /**
   * Reorders a task from one CDK drop event.
   */
  async moveFromDrop(
    event: CdkDragDrop<Task[]>,
  ): Promise<string> {
    if (this.isUpdating()) {
      return '';
    }

    const updates = createDropTaskUpdates(
      this.taskService.allTasks(),
      {
        sourceStatus:
          event.previousContainer
            .id as TaskStatus,

        targetStatus:
          event.container.id as TaskStatus,

        sourceIndex: event.previousIndex,
        targetIndex: event.currentIndex,
      },
    );

    return this.persist(updates);
  }

  /**
   * Persists task positions and restores server state on failure.
   */
  private async persist(
    updates: TaskPositionUpdate[],
  ): Promise<string> {
    if (updates.length === 0) {
      return '';
    }

    this.isUpdating.set(true);

    try {
      await this.taskService
        .updateTaskPositions(updates);

      return '';
    } catch (error) {
      await this.restoreTasksAfterError(error);

      return 'Task positions could not be saved.';
    } finally {
      this.isUpdating.set(false);
    }
  }

  /**
   * Reloads task state after a failed position update.
   */
  private async restoreTasksAfterError(
    error: unknown,
  ): Promise<void> {
    console.error(
      'Task positions could not be saved.',
      error,
    );

    try {
      await this.taskService.getTasks();
    } catch (reloadError) {
      console.error(
        'Tasks could not be reloaded.',
        reloadError,
      );
    }
  }
}