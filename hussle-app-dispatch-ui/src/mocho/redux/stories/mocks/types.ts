/**
 * Demo entity types for Storybook stories
 */

export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';

/**
 * Demo task entity for testing CRUD utilities
 */
export interface DemoTask {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Input type for creating a new task
 */
export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee?: string;
}

/**
 * Input type for updating an existing task
 */
export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee?: string;
}

/**
 * State shape for the demo task page slice
 */
export interface TaskPageState {
  query: string;
  errors: Record<string, string>;
  loading: Record<string, string>;
}

/**
 * Root state shape for demo stories
 */
export interface DemoRootState {
  pages: {
    taskPage: TaskPageState;
  };
  entities: {
    tasks: {
      ids: string[];
      entities: Record<string, DemoTask>;
    };
  };
}
