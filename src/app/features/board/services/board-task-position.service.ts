import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Injectable, inject, signal } from '@angular/core';
import { Task, TaskPositionUpdate, TaskStatus } from '../../../core/models/task.model';
import { TaskService } from '../../../core/services/task.service';
import {
  createDropTaskUpdates,
  createStatusMoveTaskUpdates,
} from '../../../core/utils/task-order.utils';

/**
 * Coordinates board task position changes and their persistence.
 *
 * Converts CDK or mobile move input into position updates and restores
 * persisted task state when an update fails.
 */
@Injectable()
export class BoardTaskPositionService {
  /** Service used to read and persist task state. */
  private readonly taskService = inject(TaskService);

  /** Indicates whether task positions are currently being persisted. */
  readonly isUpdating = signal(false);

  /**
   * Moves a task to the end of another board status.
   * @param task - Task to move.
   * @param targetStatus - Status of the target board column.
   * @returns Empty text after success or a user-facing error message.
   */
  async moveToStatus(task: Task, targetStatus: TaskStatus): Promise<string> {
    if (this.isUpdating()) {
      return '';
    }

    const updates = createStatusMoveTaskUpdates(this.taskService.allTasks(), task.id, targetStatus);

    return this.persist(updates);
  }

  /**
   * Reorders a task according to a CDK drop event.
   * @param event - Drop event containing source and target positions.
   * @returns Empty text after success or a user-facing error message.
   */
  async moveFromDrop(event: CdkDragDrop<Task[]>): Promise<string> {
    if (this.isUpdating()) {
      return '';
    }

    const updates = createDropTaskUpdates(this.taskService.allTasks(), {
      sourceStatus: event.previousContainer.id as TaskStatus,
      targetStatus: event.container.id as TaskStatus,
      sourceIndex: event.previousIndex,
      targetIndex: event.currentIndex,
    });

    return this.persist(updates);
  }

  /**
   * Persists position changes and restores server state after failure.
   * @param updates - Complete changed task position collection.
   * @returns Empty text after success or a user-facing error message.
   */
  private async persist(updates: TaskPositionUpdate[]): Promise<string> {
    if (updates.length === 0) return '';
    this.isUpdating.set(true);
    try {
      await this.taskService.updateTaskPositions(updates);
      return '';
    } catch (error) {
      await this.restoreTasksAfterError(error);
      return 'Task positions could not be saved.';
    } finally {
      this.isUpdating.set(false);
    }
  }

  /**
   * Logs the position failure and attempts to reload persisted tasks.
   * @param error - Original task position persistence error.
   * @returns A promise that resolves after the reload attempt.
   */
  private async restoreTasksAfterError(error: unknown): Promise<void> {
    console.error('Task positions could not be saved.', error);

    try {
      await this.taskService.getTasks();
    } catch (reloadError) {
      console.error('Tasks could not be reloaded.', reloadError);
    }
  }
}