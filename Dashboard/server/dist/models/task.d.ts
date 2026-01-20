export interface Task {
    id: string;
    title: string;
    description?: string;
    dueDate?: string;
    startDateTime?: string;
    endDateTime?: string;
    priority: 'low' | 'medium' | 'high';
    isCompleted: boolean;
    projectId: string;
    tagIds: string[];
    subtasks: Task[];
    eventId?: string;
    order: number;
    origin: 'local' | 'todomd';
    createdAt: string;
    updatedAt: string;
}
/**
 * Create a new task
 */
export declare function createTask(data: Partial<Task>): Promise<Task>;
/**
 * Get task by ID (with subtasks)
 */
export declare function getTaskById(id: string): Promise<Task | null>;
/**
 * Get all tasks
 */
export declare function getAllTasks(): Promise<Task[]>;
/**
 * Get tasks by project
 */
export declare function getTasksByProject(projectId: string): Promise<Task[]>;
/**
 * Update task
 */
export declare function updateTask(id: string, data: Partial<Task>): Promise<Task>;
/**
 * Delete task (and all subtasks)
 */
export declare function deleteTask(id: string): Promise<boolean>;
/**
 * Toggle task completion
 */
export declare function completeTask(id: string): Promise<Task>;
/**
 * Create subtask
 */
export declare function createSubtask(parentId: string, data: Partial<Task>): Promise<Task>;
/**
 * Reorder tasks within a project
 */
export declare function reorderTasks(projectId: string, taskIds: string[]): Promise<void>;
//# sourceMappingURL=task.d.ts.map