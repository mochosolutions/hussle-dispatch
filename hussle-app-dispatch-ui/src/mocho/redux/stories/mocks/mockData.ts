/**
 * Mock data for Storybook stories
 */

import type { DemoTask } from './types';

/**
 * Sample task data for demos
 */
export const mockTasks: DemoTask[] = [
  {
    id: 'task-1',
    title: 'Implement user authentication',
    description: 'Add JWT-based authentication to the API',
    status: 'completed',
    priority: 'high',
    assignee: 'Alice',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-16T14:30:00Z',
  },
  {
    id: 'task-2',
    title: 'Design dashboard layout',
    description: 'Create responsive dashboard mockups',
    status: 'in_progress',
    priority: 'medium',
    assignee: 'Bob',
    createdAt: '2024-01-14T09:00:00Z',
    updatedAt: '2024-01-15T11:00:00Z',
  },
  {
    id: 'task-3',
    title: 'Write API documentation',
    description: 'Document all REST endpoints with OpenAPI spec',
    status: 'pending',
    priority: 'low',
    assignee: 'Charlie',
    createdAt: '2024-01-13T08:00:00Z',
    updatedAt: '2024-01-13T08:00:00Z',
  },
  {
    id: 'task-4',
    title: 'Fix navigation bug',
    description: 'Sidebar collapse not working on mobile',
    status: 'in_progress',
    priority: 'high',
    createdAt: '2024-01-12T07:00:00Z',
    updatedAt: '2024-01-14T16:00:00Z',
  },
  {
    id: 'task-5',
    title: 'Add unit tests',
    description: 'Increase test coverage to 80%',
    status: 'pending',
    priority: 'medium',
    assignee: 'Diana',
    createdAt: '2024-01-11T06:00:00Z',
    updatedAt: '2024-01-11T06:00:00Z',
  },
];

/**
 * Get a single task by ID
 */
export const getTaskById = (id: string): DemoTask | undefined => {
  return mockTasks.find((task) => task.id === id);
};

/**
 * Create a new task with generated ID and timestamps
 */
export const createMockTask = (input: Partial<DemoTask>): DemoTask => {
  const now = new Date().toISOString();
  return {
    id: `task-${Date.now()}`,
    title: input.title || 'New Task',
    description: input.description,
    status: input.status || 'pending',
    priority: input.priority || 'medium',
    assignee: input.assignee,
    createdAt: now,
    updatedAt: now,
  };
};
