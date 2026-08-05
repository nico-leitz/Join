import { ComponentFixture, TestBed } from "@angular/core/testing";
import { signal } from "@angular/core";
import { FormControl } from "@angular/forms";
import { describe, expect, it, beforeEach, vi, afterEach } from "vitest";
import { AddTaskContent, dateNotInPastValidator } from "./add-task-content";
import { TaskService } from "../../../../core/services/task.service";
import { ContactService } from "../../../../core/services/contact.service";
import { Contact } from "../../../../core/models/contact.model";
import { Task } from "../../../../core/models/task.model";

/**
 * @description Unit tests for the AddTaskContent component.
 * This suite verifies form validation, signal state management, subtask drafting,
 * contact selection, API payload generation, and UI state resets.
 */
describe("AddTaskContent Component", () => {
  let component: AddTaskContent;
  let fixture: ComponentFixture<AddTaskContent>;
  let mockTaskService: any;
  let mockContactService: any;

  /**
   * Mock data array representing contacts loaded from the server.
   */
  const MOCK_CONTACTS: Contact[] = [
    {
      id: "c1",
      authUserId: "u1",
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      phone: "123",
      badgeColor: "#ff0000",
      createdAt: "",
      updatedAt: "",
    },
    {
      id: "c2",
      authUserId: "u2",
      firstName: "Jane",
      lastName: "Smith",
      email: "jane@example.com",
      phone: "456",
      badgeColor: "#00ff00",
      createdAt: "",
      updatedAt: "",
    },
  ];

  /**
   * Mock data array representing existing tasks.
   */
  const MOCK_TASKS: Task[] = [
    {
      id: "t1",
      title: "Existing Task",
      description: "",
      category: "technical_task",
      priority: "medium",
      status: "todo",
      dueDate: "2050-01-01",
      sortOrder: 0,
      createdAt: "",
      updatedAt: "",
    },
  ];

  beforeEach(async () => {
    mockTaskService = {
      allTasks: signal<Task[]>(MOCK_TASKS),
      getTasks: vi.fn().mockResolvedValue(MOCK_TASKS),
      createTaskWithRelations: vi
        .fn()
        .mockResolvedValue({ id: "t2", title: "New Task" }),
    };

    mockContactService = {
      allContacts: signal<Contact[]>([]),
      getContacts: vi.fn().mockResolvedValue(MOCK_CONTACTS),
    };

    await TestBed.configureTestingModule({
      imports: [AddTaskContent],
      providers: [
        { provide: TaskService, useValue: mockTaskService },
        { provide: ContactService, useValue: mockContactService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddTaskContent);
    component = fixture.componentInstance;

    vi.spyOn(component.cancelled, "emit");
    vi.spyOn(component.taskCreated, "emit");

    vi.useFakeTimers();
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /**
   * @test Ensures the component initializes correctly and handles caching logic.
   */
  it("should create the component and load initial data", async () => {
    await vi.advanceTimersByTimeAsync(0);

    expect(component).toBeTruthy();

    // Contacts start empty in the mock, so the fetch method must be called.
    expect(mockContactService.getContacts).toHaveBeenCalled();

    // Tasks start already populated in the mock, so the component's cache logic correctly prevents a fetch.
    expect(mockTaskService.getTasks).not.toHaveBeenCalled();

    expect(component.allContacts()).toEqual(MOCK_CONTACTS);
  });

  /**
   * @test Verifies that the form correctly identifies invalid states for required fields.
   */
  it("should show validation errors for invalid title and due date", () => {
    component.taskForm.controls.title.markAsTouched();
    component.taskForm.controls.dueDate.markAsTouched();

    expect(component.hasTitleError()).toBe(true);
    expect(component.getTitleErrorMessage()).toBe("This field is required");
    expect(component.hasDueDateError()).toBe(true);
    expect(component.getDueDateErrorMessage()).toBe("This field is required");
  });

  /**
   * @test Ensures the custom date validator blocks past dates.
   */
  it("should invalidate past due dates", () => {
    component.taskForm.controls.dueDate.setValue("2000-01-01");
    component.taskForm.controls.dueDate.markAsTouched();

    expect(component.hasDueDateError()).toBe(true);
    expect(component.getDueDateErrorMessage()).toBe(
      "Due date cannot be in the past",
    );
  });

  /**
   * @test Verifies the priority selection updates the form control appropriately.
   */
  it("should update priority when setPriority is called", () => {
    component.setPriority("urgent");

    expect(component.taskForm.controls.priority.value).toBe("urgent");
    expect(component.taskForm.controls.priority.dirty).toBe(true);
  });

  /**
   * @test Tests the contact selection logic and its computed signal.
   */
  it("should toggle contact selection and update selected contacts", () => {
    component.toggleContactSelection("c1");

    expect(component.isContactSelected("c1")).toBe(true);
    expect(component.selectedContactIds()).toContain("c1");
    expect(component.selectedContacts().length).toBe(1);
    expect(component.selectedContacts()[0].firstName).toBe("John");

    component.toggleContactSelection("c1");

    expect(component.isContactSelected("c1")).toBe(false);
    expect(component.selectedContactIds()).not.toContain("c1");
  });

  /**
   * @test Tests the full lifecycle of drafting, editing, and deleting a subtask.
   */
  it("should manage subtask creation, editing, and deletion", () => {
    component.newSubtaskTitle.set("Draft Subtask");
    component.addSubtask();

    expect(component.draftSubtasks().length).toBe(1);
    expect(component.draftSubtasks()[0].title).toBe("Draft Subtask");
    expect(component.newSubtaskTitle()).toBe("");

    component.startEditingSubtask(0);
    expect(component.editingSubtaskIndex()).toBe(0);

    component.editingSubtaskTitle.set("Edited Subtask");
    component.saveSubtaskEdit();

    expect(component.draftSubtasks()[0].title).toBe("Edited Subtask");
    expect(component.editingSubtaskIndex()).toBeNull();

    component.removeSubtask(0);
    expect(component.draftSubtasks().length).toBe(0);
  });

  /**
   * @test Verifies that clicking a subtask title opens its inline editor.
   */
  it("should start editing when the subtask title is clicked", () => {
    component.draftSubtasks.set([{ title: "Clickable Subtask" }]);
    fixture.detectChanges();

    const titleButton = fixture.nativeElement.querySelector(
      ".add-task__subtask-title",
    ) as HTMLButtonElement;

    titleButton.click();
    fixture.detectChanges();

    expect(component.editingSubtaskIndex()).toBe(0);
    expect(component.editingSubtaskTitle()).toBe("Clickable Subtask");
    expect(
      fixture.nativeElement.querySelector(".add-task__subtask-edit-input"),
    ).toBeTruthy();
  });

  /**
   * @test Verifies that selecting a category updates the form and closes the dropdown menu.
   */
  it("should select a category and close the category menu", () => {
    component.toggleCategoryMenu();
    expect(component.categoryMenuOpen()).toBe(true);

    component.selectCategory("technical_task");

    expect(component.taskForm.controls.category.value).toBe("technical_task");
    expect(component.getCategoryLabel()).toBe("Technical Task");
    expect(component.categoryMenuOpen()).toBe(false);
  });

  /**
   * @test Checks the complete task creation workflow including payload formatting and success events.
   */
  it("should successfully submit the form and emit creation event", async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    const validDateString = futureDate.toISOString().split("T")[0];

    component.taskForm.patchValue({
      title: "Integration Test Task",
      description: "Test description",
      dueDate: validDateString,
      priority: "low",
      category: "user_story",
    });

    component.toggleContactSelection("c2");

    component.newSubtaskTitle.set("Subtask 1");
    component.addSubtask();

    await component.submitTask();

    expect(mockTaskService.createTaskWithRelations).toHaveBeenCalledWith({
      task: {
        title: "Integration Test Task",
        description: "Test description",
        dueDate: validDateString,
        priority: "low",
        category: "user_story",
        status: "todo",
        sortOrder: 1,
      },
      subtasks: [{ title: "Subtask 1", sortOrder: 0 }],
      contactIds: ["c2"],
    });

    expect(component.taskCreated.emit).toHaveBeenCalled();
    expect(component.successMessage()).toBe("Task successfully created");
  });

  /**
   * @test Ensures the success message is cleared automatically after the specified timer.
   */
  it("should hide the success message after 2200ms", async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);

    component.taskForm.patchValue({
      title: "Valid Task",
      dueDate: futureDate.toISOString().split("T")[0],
      priority: "medium",
      category: "technical_task",
    });

    await component.submitTask();
    expect(component.successMessage()).toBe("Task successfully created");

    vi.advanceTimersByTime(2200);

    expect(component.successMessage()).toBe("");
  });

  /**
   * @test Checks that secondary action emits cancellation when operating in dialog mode.
   */
  it("should emit cancelled event on secondary action when in dialog mode", () => {
    fixture.componentRef.setInput("mode", "dialog");
    fixture.detectChanges();

    component.handleSecondaryAction();

    expect(component.cancelled.emit).toHaveBeenCalled();
  });

  /**
   * @test Checks that secondary action resets the form completely when operating in page mode.
   */
  it("should clear the form on secondary action when in page mode", () => {
    fixture.componentRef.setInput("mode", "page");
    fixture.detectChanges();

    component.taskForm.patchValue({ title: "Draft title" });
    component.toggleContactSelection("c1");
    component.newSubtaskTitle.set("Draft subtask");
    component.addSubtask();

    component.handleSecondaryAction();

    expect(component.taskForm.controls.title.value).toBe("");
    expect(component.selectedContactIds().length).toBe(0);
    expect(component.draftSubtasks().length).toBe(0);
  });

  /**
   * @test Verifies the host listener closes active dropdown menus when a click occurs outside.
   */
  it("should close menus on document click", () => {
    component.toggleContactsMenu();
    component.toggleCategoryMenu();

    document.dispatchEvent(new MouseEvent("click"));

    expect(component.contactsMenuOpen()).toBe(false);
    expect(component.categoryMenuOpen()).toBe(false);
  });
});

/**
 * @description Unit tests for the isolated custom date validator.
 */
describe("dateNotInPastValidator", () => {
  /**
   * @test Ensures the validator allows today's date.
   */
  it("should return null for today or future dates", () => {
    const validator = dateNotInPastValidator();

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const control = new FormControl(todayStr);
    expect(validator(control)).toBeNull();
  });

  /**
   * @test Ensures the validator returns an error object for past dates.
   */
  it("should return error object for past dates", () => {
    const validator = dateNotInPastValidator();
    const control = new FormControl("1999-12-31");

    expect(validator(control)).toEqual({ dateInPast: true });
  });
});