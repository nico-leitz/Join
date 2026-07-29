# Drag and Drop System Technical Specification and implementation

This document serves as the formal technical specification for the Drag and Drop (D&D) architecture. It covers the component-level implementation, state management strategies, normalization algorithms, and persistence mechanisms.

---

## 1. Introduction and UX Philosophy

The Drag and Drop system is designed to provide an "Optimistic UI" experience. In a modern web application, network latency is the enemy of perceived performance. If the interface waits for the backend to confirm a task move before updating, the application feels sluggish and non-responsive.

Our D&D system resolves this by decoupling the visual update from the backend synchronization. The UI updates instantaneously based on the user's intent, while the synchronization logic runs asynchronously in the background.

---

## 2. Component and CDK Directives

The system utilizes the Angular Component Dev Kit (CDK). The following directives are the backbone of the column and task interaction:

### 2.1. CdkDropList

Each column in the board (Todo, In Progress, Awaiting Feedback, Done) is defined as a `CdkDropList`. 

*   The `cdkDropListData` input is bound directly to the tasks array for that column.

*   The `cdkDropListConnectedTo` input defines the relationship between columns, allowing tasks to be moved between lists.

*   The `cdkDropListDropped` event is the primary entry point for all reordering and transfer logic.

### 2.2. CdkDrag

Each task card is wrapped in a `CdkDrag` directive.

*   The `cdkDragData` property carries the full Task object, which is essential for the `drop()` event handling.

*   `cdkDragPreview` templates are used to create the floating card element during the dragging process, ensuring the user maintains context.

---

## 3. The Drop Pipeline

The `drop()` method is the centralized handler. It is an `async` function designed to manage the entire lifecycle of a drag operation.

### 3.1. Step-by-Step Execution

*   Validation: We immediately check `isDragDisabled()`. If true, the event is aborted to prevent illegal state changes.

*   Optimistic Mutation: We execute the `moveDroppedTask()` helper. This updates the local signals and arrays, causing the UI to re-render in the user's browser immediately.

*   Delta Calculation: We run `createDropUpdates()` to determine which database records actually require an update.

*   Persistence: We initiate `persistTaskUpdates()`. This handles the actual network communication with the backend.

---

## 4. State Mutation Logic

The state mutation relies on two core functions imported from the Angular CDK, which we wrap for controlled execution.

### 4.1. moveDroppedTask(event: CdkDragDrop<Task[]>)

This method distinguishes between two scenarios:

*   Reordering: If `previousContainer === container`, we use `moveItemInArray`. This shifts the order of elements within a single array, updating indices `previousIndex` to `currentIndex`.

*   Transferring: If the containers differ, we use `transferArrayItem`. This is more complex:

    *   It removes the item from the source array.

    *   It inserts the item into the destination array at the specified index.

    *   It updates the metadata (like the status) of the moved task to match the destination column.

---

## 5. Normalization and Delta Algorithms

One of the most complex challenges in this system is ensuring that the `sortOrder` in the database matches the visual order on the screen.

### 5.1. Normalization

The `normalizeColumnTasks` method is executed every time an item is dropped. The logic is as follows:

*   Iterate through the entire task array of the target column.

*   Map the array to new objects.

*   Assign the `status` based on the column the task is now in.

*   Assign the `sortOrder` based on the array's new `index`.

This ensures that the "Source of Truth" (the database) always mirrors the state of the "Frontend View."

### 5.2. Delta Calculation

We perform a differential analysis to avoid "Over-fetching" or "Over-saving."

*   We define the "Delta" as the subset of tasks that changed.

*   We create a Map from the previous state of the tasks.

*   We compare the normalized tasks (post-drop) to the previous state.

*   We only add a task to the persistence queue if:

    *   The `status` has changed.

    *   The `sortOrder` has changed.

This optimization is critical. If a user moves a task from the bottom to the top of a column, every task in that column technically changes its `sortOrder`. We must detect this and update every task's `sortOrder` in the database to maintain perfect consistency.

---

## 6. Persistence and Error Recovery

Persistence is the layer where our optimistic UI meets the reality of network requests.

### 6.1. The Persistence Lifecycle

*   Lock: `isBoardUpdating.set(true)` is called immediately. This signal disables further D&D operations, preventing "Race Conditions" (where a second drag starts before the first one finishes).

*   Execution: We iterate through the Delta array. We use `Promise.all` to fire all update requests in parallel, maximizing speed.

*   Finally: We use a `finally` block to ensure `isBoardUpdating.set(false)` is always called, even if the requests fail.

### 6.2. Error Handling

We implement a "Hard Reset" strategy for errors:

*   If any update request fails, we do not attempt to guess the correct state.

*   We clear the current local state.

*   We force a re-fetch of the entire dataset via `taskService.getTasks()`.

*   This ensures the UI is always perfectly aligned with the database, even after a connection drop or server timeout.

---

## 7. Custom Pointer and Scroll Orchestration

To support mobile devices and trackpad navigation, we implemented a custom horizontal scroll handler. This exists outside of the standard D&D logic but works in tandem with it.

### 7.1. Pointer Down

The listener is attached to the column container.

*   We check `isInteractiveTarget`. If the user is clicking a button, input, or checkbox, we return early to allow the browser's default behavior.

*   If it is a generic background click, we record the `startPointerX` and `startScrollLeft`.

### 7.2. Pointer Move

We measure the delta between `currentPointerX` and `startPointerX`.

*   We apply this delta to the scroll container's `scrollLeft` property.

*   We use `setPointerCapture` to ensure the scroll continues even if the user's finger moves slightly outside the container boundaries.

### 7.3. Interaction Conflict Resolution

The primary conflict occurs when a user wants to scroll but accidentally clicks a task card. 

*   We track `horizontalScrollMoved`.

*   If a scroll movement exceeds the `horizontalMoveThreshold` (set to 5px), we set a flag.

*   When the `PointerEnd` event fires, if the flag is set, we suppress the "click" event for the target card for one execution cycle using a `setTimeout(0)`.

*   This prevents the "Dialog Open" action from triggering during a scroll-navigation gesture.

---

## 8. Best Practice Principles

### 8.1. Separation of Concerns

The `drop()` method does not contain business logic. It delegates:

*   UI Logic -> `moveDroppedTask()`

*   Calculation Logic -> `createDropUpdates()`

*   Persistence Logic -> `persistTaskUpdates()`

*   Error Logic -> `handleTaskUpdateError()`

### 8.2. Immutability

All state changes are performed using immutable patterns (e.g., using the spread operator `{ ...task }`). We never mutate an existing object in the state signal; we replace it. This is essential for Angular's Change Detection to work correctly.

### 8.3. Performance Analysis

*   The delta calculation runs in O(N) time, where N is the number of tasks in the affected column.

*   The UI update runs in O(1) time (relative to DOM manipulation).

*   Network overhead is minimized by only sending modified tasks.

---

## 9. Common Pitfalls and Mitigation

### 9.1. Race Conditions

If a user performs multiple rapid drags, the `isDragDisabled` computed signal provides a safety lock. It evaluates the `isBoardUpdating` state. If the system is currently syncing with the database, all drag interactions are blocked.

### 9.2. Empty Container Handling

A common issue in D&D implementations is failing to drop items into an empty container. Angular CDK handles this by allowing the `CdkDropList` to calculate bounding boxes even when empty. We ensure the `min-height` of the columns is sufficient to capture these events.

### 9.3. Index Mismatch

In the event of a network failure during a move, the local state might look different from the server state. The recovery logic (re-fetching the list) is mandatory. Without this, the frontend would remain permanently "out of sync," leading to incorrect sorting indices and potentially breaking future D&D operations.

---

## 10. Summary of Signals

The system relies on a set of strictly defined signals:

*   `isDragging`: Tracks if a drag is currently active.

*   `isBoardUpdating`: Tracks if a sync is currently in progress.

*   `allTasks`: The source of truth for the board state.

*   `isSearchActive`: Disables D&D when the view is filtered (to prevent invalid indexing).

By adhering to this architectural pattern, the D&D system remains robust, testable, and highly performant across all device types.