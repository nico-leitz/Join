export interface TaskAssignmentRow {
  task_id: string;
  contact_id: string;
  created_at: string;
}

export interface TaskAssignment {
  taskId: string;
  contactId: string;
  createdAt: string;
}

export interface CreateTaskAssignment {
  taskId: string;
  contactId: string;
}