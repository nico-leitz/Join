import { Subtask } from './subtask.model';
import { TaskAssignmentRow } from './task-assignment.model';

export interface BoardRelationsData {
  subtasks: Subtask[];
  assignments: TaskAssignmentRow[];
}
