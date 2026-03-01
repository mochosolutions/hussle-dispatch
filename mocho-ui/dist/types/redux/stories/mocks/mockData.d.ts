import { DemoTask } from './types';
/**
 * Sample task data for demos
 */
export declare const mockTasks: DemoTask[];
/**
 * Get a single task by ID
 */
export declare const getTaskById: (id: string) => DemoTask | undefined;
/**
 * Create a new task with generated ID and timestamps
 */
export declare const createMockTask: (input: Partial<DemoTask>) => DemoTask;
//# sourceMappingURL=mockData.d.ts.map