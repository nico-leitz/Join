import { Subtask } from './subtask.model';
import { TaskAssignmentRow } from './task-assignment.model';

/**
 * Contains the relation data required to populate the task board.
 */
export interface BoardRelationsData {
  /** All mapped subtasks loaded for the board. */
  subtasks: Subtask[];

  /** All task assignment rows loaded for the board. */
  assignments: TaskAssignmentRow[];
}