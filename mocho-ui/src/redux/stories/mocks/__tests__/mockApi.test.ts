import { createMockApi, MockApiOptions } from '../mockApi';
import type { DemoTask, CreateTaskInput, UpdateTaskInput } from '../types';

describe('createMockApi', () => {
  const initialTasks: DemoTask[] = [
    {
      id: 'task-1',
      title: 'Task 1',
      status: 'pending',
      priority: 'medium',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'task-2',
      title: 'Task 2',
      status: 'in_progress',
      priority: 'high',
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    },
  ];

  describe('getAll', () => {
    it('returns all entities', async () => {
      const api = createMockApi<DemoTask>(initialTasks);
      const result = await api.getAll();
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('task-1');
      expect(result[1].id).toBe('task-2');
    });

    it('respects delay option', async () => {
      const api = createMockApi<DemoTask>(initialTasks, { delay: 50 });
      const start = Date.now();
      await api.getAll();
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(45); // Allow slight timing variance
    });

    it('throws error when shouldFail is true', async () => {
      const api = createMockApi<DemoTask>(initialTasks, {
        shouldFail: true,
        errorMessage: 'Custom error',
      });
      await expect(api.getAll()).rejects.toThrow('Custom error');
    });

    it('uses default error message when shouldFail is true', async () => {
      const api = createMockApi<DemoTask>(initialTasks, { shouldFail: true });
      await expect(api.getAll()).rejects.toThrow('API Error');
    });
  });

  describe('getById', () => {
    it('returns entity by ID', async () => {
      const api = createMockApi<DemoTask>(initialTasks);
      const result = await api.getById('task-1');
      expect(result.id).toBe('task-1');
      expect(result.title).toBe('Task 1');
    });

    it('throws error for non-existent ID', async () => {
      const api = createMockApi<DemoTask>(initialTasks);
      await expect(api.getById('non-existent')).rejects.toThrow('Entity not found');
    });

    it('throws error when shouldFail is true', async () => {
      const api = createMockApi<DemoTask>(initialTasks, { shouldFail: true });
      await expect(api.getById('task-1')).rejects.toThrow('API Error');
    });
  });

  describe('create', () => {
    it('creates a new entity with generated ID', async () => {
      const api = createMockApi<DemoTask, CreateTaskInput>(initialTasks);
      const input: CreateTaskInput = {
        title: 'New Task',
        status: 'pending',
        priority: 'low',
      };

      const result = await api.create(input);

      expect(result.id).toBeDefined();
      expect(result.title).toBe('New Task');
      expect(result.status).toBe('pending');
      expect(result.priority).toBe('low');
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it('adds entity to internal data store', async () => {
      const api = createMockApi<DemoTask, CreateTaskInput>(initialTasks);
      const input: CreateTaskInput = { title: 'New Task', priority: 'low' };

      const created = await api.create(input);
      const allEntities = await api.getAll();

      expect(allEntities).toHaveLength(3);
      expect(allEntities.find((e) => e.id === created.id)).toBeDefined();
    });

    it('throws error when shouldFail is true', async () => {
      const api = createMockApi<DemoTask, CreateTaskInput>(initialTasks, { shouldFail: true });
      await expect(api.create({ title: 'New Task', priority: 'low' })).rejects.toThrow('API Error');
    });
  });

  describe('update', () => {
    it('updates existing entity', async () => {
      const api = createMockApi<DemoTask, CreateTaskInput, UpdateTaskInput>(initialTasks);
      const update: UpdateTaskInput = { title: 'Updated Title' };

      const result = await api.update('task-1', update);

      expect(result.id).toBe('task-1');
      expect(result.title).toBe('Updated Title');
      expect(result.status).toBe('pending'); // Unchanged
    });

    it('updates updatedAt timestamp', async () => {
      const api = createMockApi<DemoTask>(initialTasks);
      const original = await api.getById('task-1');

      // Ensure some time passes
      await new Promise((resolve) => setTimeout(resolve, 10));

      const result = await api.update('task-1', { title: 'Updated' });

      expect(new Date(result.updatedAt).getTime()).toBeGreaterThan(
        new Date(original.updatedAt).getTime()
      );
    });

    it('throws error for non-existent ID', async () => {
      const api = createMockApi<DemoTask>(initialTasks);
      await expect(api.update('non-existent', { title: 'Test' })).rejects.toThrow(
        'Entity not found'
      );
    });

    it('throws error when shouldFail is true', async () => {
      const api = createMockApi<DemoTask>(initialTasks, { shouldFail: true });
      await expect(api.update('task-1', { title: 'Test' })).rejects.toThrow('API Error');
    });
  });

  describe('delete', () => {
    it('deletes entity by ID', async () => {
      const api = createMockApi<DemoTask>(initialTasks);

      await api.delete('task-1');

      const allEntities = await api.getAll();
      expect(allEntities).toHaveLength(1);
      expect(allEntities.find((e) => e.id === 'task-1')).toBeUndefined();
    });

    it('throws error for non-existent ID', async () => {
      const api = createMockApi<DemoTask>(initialTasks);
      await expect(api.delete('non-existent')).rejects.toThrow('Entity not found');
    });

    it('throws error when shouldFail is true', async () => {
      const api = createMockApi<DemoTask>(initialTasks, { shouldFail: true });
      await expect(api.delete('task-1')).rejects.toThrow('API Error');
    });
  });

  describe('deleteMany', () => {
    it('deletes multiple entities', async () => {
      const api = createMockApi<DemoTask>(initialTasks);

      const result = await api.deleteMany(['task-1', 'task-2']);

      expect(result.deleted).toBe(2);
      expect(result.postIds).toEqual(['task-1', 'task-2']);

      const remaining = await api.getAll();
      expect(remaining).toHaveLength(0);
    });

    it('only deletes existing entities', async () => {
      const api = createMockApi<DemoTask>(initialTasks);

      const result = await api.deleteMany(['task-1', 'non-existent']);

      expect(result.deleted).toBe(1);
      expect(result.postIds).toEqual(['task-1']);
    });

    it('throws error when shouldFail is true', async () => {
      const api = createMockApi<DemoTask>(initialTasks, { shouldFail: true });
      await expect(api.deleteMany(['task-1'])).rejects.toThrow('API Error');
    });
  });

  describe('updateMany', () => {
    it('updates multiple entities', async () => {
      const api = createMockApi<DemoTask>(initialTasks);

      const result = await api.updateMany(['task-1', 'task-2'], { status: 'completed' });

      expect(result.updated).toBe(2);
      expect(result.postIds).toEqual(['task-1', 'task-2']);

      const task1 = await api.getById('task-1');
      const task2 = await api.getById('task-2');
      expect(task1.status).toBe('completed');
      expect(task2.status).toBe('completed');
    });

    it('only updates existing entities', async () => {
      const api = createMockApi<DemoTask>(initialTasks);

      const result = await api.updateMany(['task-1', 'non-existent'], { status: 'completed' });

      expect(result.updated).toBe(1);
      expect(result.postIds).toEqual(['task-1']);
    });

    it('throws error when shouldFail is true', async () => {
      const api = createMockApi<DemoTask>(initialTasks, { shouldFail: true });
      await expect(api.updateMany(['task-1'], { status: 'completed' })).rejects.toThrow(
        'API Error'
      );
    });
  });

  describe('setOptions', () => {
    it('allows changing options after creation', async () => {
      const api = createMockApi<DemoTask>(initialTasks);

      // Should succeed initially
      await expect(api.getAll()).resolves.toBeDefined();

      // Update options to fail
      api.setOptions({ shouldFail: true, errorMessage: 'Now failing' });

      // Should fail after options update
      await expect(api.getAll()).rejects.toThrow('Now failing');
    });
  });

  describe('reset', () => {
    it('resets data to initial state', async () => {
      const api = createMockApi<DemoTask>(initialTasks);

      // Modify data
      await api.delete('task-1');
      let allEntities = await api.getAll();
      expect(allEntities).toHaveLength(1);

      // Reset
      api.reset();

      // Check data is restored
      allEntities = await api.getAll();
      expect(allEntities).toHaveLength(2);
    });
  });

  describe('getData', () => {
    it('returns current data state', async () => {
      const api = createMockApi<DemoTask>(initialTasks);

      const data = api.getData();
      expect(data).toHaveLength(2);

      await api.create({ title: 'New Task', priority: 'low' });

      const updatedData = api.getData();
      expect(updatedData).toHaveLength(3);
    });
  });
});
