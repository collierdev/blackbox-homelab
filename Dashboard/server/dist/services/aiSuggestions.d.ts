interface TaskSuggestion {
    title: string;
    description?: string;
    priority: 'low' | 'medium' | 'high';
    projectId?: string;
    reasoning: string;
}
/**
 * Generate task suggestions based on current calendar and tasks
 */
export declare function generateTaskSuggestions(limit?: number): Promise<TaskSuggestion[]>;
/**
 * Analyze task patterns and provide insights
 */
export declare function analyzeTaskPatterns(): Promise<{
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
    averageTasksPerProject: number;
    mostActiveProject: string | null;
    overdueTasks: number;
    insights: string[];
}>;
export {};
//# sourceMappingURL=aiSuggestions.d.ts.map