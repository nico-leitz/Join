import {
  Task,
  TaskStatus,
} from '../models/task.model';

export interface TaskFilterOptions {
  searchTerm?: string;
  status?: TaskStatus;
}

export function filterTasks(
  tasks: Task[],
  options: TaskFilterOptions,
): Task[] {
  const searchedTasks = filterTasksBySearchTerm(
    tasks,
    options.searchTerm ?? '',
  );

  return filterTasksByStatus(
    searchedTasks,
    options.status,
  );
}

export function filterTasksBySearchTerm(
  tasks: Task[],
  searchTerm: string,
): Task[] {
  const normalizedSearchTerm =
    normalizeSearchTerm(searchTerm);

  if (!normalizedSearchTerm) {
    return [...tasks];
  }

  return tasks.filter((task) => {
    return matchesTaskSearch(task, normalizedSearchTerm);
  });
}

export function filterTasksByStatus(
  tasks: Task[],
  status?: TaskStatus,
): Task[] {
  if (!status) {
    return [...tasks];
  }

  return tasks.filter((task) => {
    return task.status === status;
  });
}

function normalizeSearchTerm(searchTerm: string): string {
  return searchTerm.trim().toLowerCase();
}

function matchesTaskSearch(
  task: Task,
  searchTerm: string,
): boolean {
  return (
    task.title.toLowerCase().includes(searchTerm) ||
    task.description.toLowerCase().includes(searchTerm)
  );
}