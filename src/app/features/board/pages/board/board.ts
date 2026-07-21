import { Component, inject, signal, OnInit, computed } from '@angular/core';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
  CdkDrag,
  CdkDropList,
  CdkDropListGroup,
} from '@angular/cdk/drag-drop';
import { TaskCard } from '../../components/task-card/task-card';
import { BoardCardsDialog } from '../../../tasks/components/board-cards-dialog/board-cards-dialog';
import { TaskService } from '../../../../core/services/task.service';
import { Task, TaskStatus } from '../../../../core/models/task.model';
import { ContactService } from '../../../../core/services/contact.service';
import { Subtask } from '../../../../core/models/subtask.model';
import { Contact } from '../../../../core/models/contact.model';
import { Header } from '../../../../layout/header/header';
import { Sidebar } from '../../../../layout/sidebar/sidebar';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [
    TaskCard,
    BoardCardsDialog,
    CdkDropListGroup,
    CdkDropList,
    CdkDrag,
    Header,
    Sidebar,
  ],
  templateUrl: './board.html',
  styleUrl: './board.scss',
})
export class Board implements OnInit {
  taskService = inject(TaskService);
  contactService = inject(ContactService);
  protected readonly isMobileViewport = signal(this.getIsMobileViewport());

  isDialogOpen = signal(false);

  allSubtasks = signal<Subtask[]>([]);
  allAssignments = signal<any[]>([]);
  allContacts = signal<Contact[]>([]);

  private sortTasks = (tasks: Task[]) => 
    tasks.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  todo = computed(() => this.sortTasks(this.taskService.allTasks().filter((t) => t.status === 'todo')));
  inProgress = computed(() => this.sortTasks(this.taskService.allTasks().filter((t) => t.status === 'in_progress')));
  awaitFeedback = computed(() => this.sortTasks(this.taskService.allTasks().filter((t) => t.status === 'awaiting_feedback')));
  done = computed(() => this.sortTasks(this.taskService.allTasks().filter((t) => t.status === 'done')));

  async ngOnInit() {
    await Promise.all([this.taskService.getTasks(), this.loadBoardData()]);
  }

  private async loadBoardData() {
    const data = await this.taskService.loadAllBoardData();
    this.allSubtasks.set(data.subtasks);
    this.allAssignments.set(data.assignments);

    const contacts = await this.contactService.getContacts();
    this.allContacts.set(contacts);
  }

  getSubtasksForTask(taskId: string): Subtask[] {
    return this.allSubtasks().filter((s) => s.taskId === taskId);
  }

  getContactsForTask(taskId: string): Contact[] {
    const assignmentIds = this.allAssignments()
      .filter((a) => a.task_id === taskId)
      .map((a) => a.contact_id);

    return this.allContacts().filter((c) => assignmentIds.includes(c.id));
  }

  openDialog(): void {
    this.isDialogOpen.set(true);
  }

  closeDialog(): void {
    this.isDialogOpen.set(false);
  }

  protected onWindowResize(): void {
    this.isMobileViewport.set(this.getIsMobileViewport());
  }

  protected async moveTaskToStatus(task: Task, targetStatus: TaskStatus): Promise<void> {
    if (task.status === targetStatus) {
      return;
    }

    const currentTasks = this.taskService.allTasks();
    const sourceTasks = this.sortTasks(
      currentTasks.filter((currentTask) => {
        return currentTask.status === task.status && currentTask.id !== task.id;
      }),
    ).map((currentTask, index) => ({
      ...currentTask,
      sortOrder: index,
    }));

    const targetTasks = this.sortTasks(
      currentTasks.filter((currentTask) => {
        return currentTask.status === targetStatus && currentTask.id !== task.id;
      }),
    );

    const movedTask: Task = {
      ...task,
      status: targetStatus,
      sortOrder: targetTasks.length,
    };

    const updatedTargetTasks = [...targetTasks, movedTask].map((currentTask, index) => ({
      ...currentTask,
      sortOrder: index,
    }));

    const updatedTasks = [...sourceTasks, ...updatedTargetTasks];
    this.taskService.updateTasksLocally(updatedTasks);

    try {
      await Promise.all(
        updatedTasks.map((updatedTask) => {
          return this.taskService.updateTask(updatedTask.id, {
            status: updatedTask.status,
            sortOrder: updatedTask.sortOrder,
          });
        }),
      );
    } catch (error) {
      await this.taskService.getTasks();
      console.error('Problem with moving task through mobile menu:', error);
    }
  }

  private getIsMobileViewport(): boolean {
    return typeof window !== 'undefined' && window.innerWidth <= 640;
  }

  async drop(event: CdkDragDrop<Task[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }

    const newStatus = event.container.id as TaskStatus;
    const updatedList = event.container.data.map((task: Task, index: number) => ({
      ...task,
      status: newStatus,
      sortOrder: index
    }));

    this.taskService.updateTasksLocally(updatedList);

    try {
      await Promise.all(updatedList.map((task: Task) => 
        this.taskService.updateTask(task.id, { status: task.status, sortOrder: task.sortOrder })
      ));
    } catch (error) {
      console.error('Problem with sorting tasks in the correct order within the database:', error);
    }
  }
}