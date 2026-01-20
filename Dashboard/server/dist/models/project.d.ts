export interface Project {
    id: string;
    name: string;
    color: string;
    order: number;
    createdAt: string;
}
/**
 * Create a new project
 */
export declare function createProject(name: string, color?: string): Promise<Project>;
/**
 * Get all projects
 */
export declare function getAllProjects(): Promise<Project[]>;
/**
 * Get project by ID
 */
export declare function getProjectById(id: string): Promise<Project | null>;
/**
 * Update project
 */
export declare function updateProject(id: string, data: Partial<Project>): Promise<Project>;
/**
 * Delete project (optionally cascade delete events/tasks)
 */
export declare function deleteProject(id: string, cascade?: boolean): Promise<boolean>;
/**
 * Reorder projects
 */
export declare function reorderProjects(projectIds: string[]): Promise<void>;
/**
 * Get project by name
 */
export declare function getProjectByName(name: string): Promise<Project | null>;
//# sourceMappingURL=project.d.ts.map