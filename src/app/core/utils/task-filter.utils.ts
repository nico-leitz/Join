import {
  Task,
  TaskStatus,
} from '../models/task.model';

/**
 * Defines the available task filter criteria.
 */
export interface TaskFilterOptions {
  /** Optional text matched against task titles and descriptions. */
  searchTerm?: string;

  /** Optional status used to restrict the returned tasks. */
  status?: TaskStatus;
}

/**
 * Applies the configured search and status filters to a task collection.
 *
 * @param tasks - Tasks to filter.
 * @param options - Search and status filter options.
 * @returns Filtered task collection.
 */
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

/**
 * Filters tasks by a case-insensitive title or description match.
 *
 * @param tasks - Tasks to search.
 * @param searchTerm - Text to match against task content.
 * @returns Matching tasks or a copy of all tasks for an empty search.
 */
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
    return matchesTaskSearch(
      task,
      normalizedSearchTerm,
    );
  });
}

/**
 * Filters tasks by their board status.
 *
 * @param tasks - Tasks to filter.
 * @param status - Required task status or undefined for no status filter.
 * @returns Matching tasks or a copy of all tasks when no status is provided.
 */
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

/**
 * Normalizes a task search term for case-insensitive matching.
 *
 * @param searchTerm - Search term to normalize.
 * @returns Trimmed lowercase search term.
 */
function normalizeSearchTerm(
  searchTerm: string,
): string {
  return searchTerm.trim().toLowerCase();
}

/**
 * Determines whether a task matches a normalized search term.
 *
 * @param task - Task to inspect.
 * @param searchTerm - Normalized search term.
 * @returns True when the title or description contains the search term.
 */
function matchesTaskSearch(
  task: Task,
  searchTerm: string,
): boolean {
  return (
    task.title.toLowerCase().includes(searchTerm) ||
    task.description.toLowerCase().includes(searchTerm)
  );
}