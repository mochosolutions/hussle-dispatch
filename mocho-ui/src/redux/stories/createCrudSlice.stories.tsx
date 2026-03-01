/**
 * createCrudSlice Stories
 *
 * Interactive demos showing how createCrudSlice works,
 * including state transitions and entity-level tracking.
 */

import React, { useMemo } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { Box, Button, Stack, Typography, Chip, Divider, Paper } from '@mui/material';
import { configureStore } from '@reduxjs/toolkit';

import { createCrudSlice, CrudPageState, getCrudActionNames } from '../createCrudSlice';
import { LoadingState } from '../types/loadingState';
import { StateInspector } from './components/StateInspector';
import type { DemoTask, CreateTaskInput, UpdateTaskInput, TaskPageState } from './mocks/types';

// =============================================================================
// Demo Slice Setup
// =============================================================================

/**
 * Create a demo slice for tasks
 */
const taskPageSlice = createCrudSlice({
  name: 'taskPage',
  entityName: 'task',
  entityNamePlural: 'tasks',
});

/**
 * Typed actions for the task page slice
 */
const taskPageActions = taskPageSlice.actions as {
  fetchTasksRequest: (payload?: void) => { type: string; payload?: void };
  fetchTasksSuccess: (payload: unknown) => { type: string; payload: unknown };
  fetchTasksFailure: (payload: { error: string }) => { type: string; payload: { error: string } };
  fetchTaskDetailsRequest: (payload: { id: string }) => { type: string; payload: { id: string } };
  fetchTaskDetailsSuccess: (payload: { id: string }) => { type: string; payload: { id: string } };
  fetchTaskDetailsFailure: (payload: { error: string; id?: string }) => {
    type: string;
    payload: { error: string; id?: string };
  };
  createTaskRequest: (payload: { data: CreateTaskInput }) => {
    type: string;
    payload: { data: CreateTaskInput };
  };
  createTaskSuccess: (payload: unknown) => { type: string; payload: unknown };
  createTaskFailure: (payload: { error: string }) => { type: string; payload: { error: string } };
  updateTaskRequest: (payload: { id: string; data: UpdateTaskInput }) => {
    type: string;
    payload: { id: string; data: UpdateTaskInput };
  };
  updateTaskSuccess: (payload: { id: string }) => { type: string; payload: { id: string } };
  updateTaskFailure: (payload: { error: string; id?: string }) => {
    type: string;
    payload: { error: string; id?: string };
  };
  deleteTaskRequest: (payload: { id: string }) => { type: string; payload: { id: string } };
  deleteTaskSuccess: (payload: { id: string }) => { type: string; payload: { id: string } };
  deleteTaskFailure: (payload: { error: string; id?: string }) => {
    type: string;
    payload: { error: string; id?: string };
  };
};

// =============================================================================
// Story Wrapper Component
// =============================================================================

interface StoryWrapperProps {
  children: React.ReactNode;
}

function StoryWrapper({ children }: StoryWrapperProps) {
  const store = useMemo(
    () =>
      configureStore({
        reducer: {
          taskPage: taskPageSlice.reducer,
        },
      }),
    []
  );

  return <Provider store={store}>{children}</Provider>;
}

// =============================================================================
// Demo Components
// =============================================================================

/**
 * Component showing the generated action names
 */
function SliceCreationDemo() {
  const actionNames = getCrudActionNames('task', 'tasks');
  const state = useSelector((s: { taskPage: TaskPageState }) => s.taskPage);

  return (
    <Box sx={{ width: '100%', maxWidth: 800 }}>
      <Typography variant="h6" gutterBottom>
        Generated Action Names
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        <code>createCrudSlice</code> generates standardized action names based on entity names.
      </Typography>

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Fetch All (Operation-level)
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Chip label={actionNames.fetchRequest} size="small" color="primary" variant="outlined" />
          <Chip label={actionNames.fetchSuccess} size="small" color="success" variant="outlined" />
          <Chip label={actionNames.fetchFailure} size="small" color="error" variant="outlined" />
        </Stack>

        <Typography variant="subtitle2" gutterBottom>
          Fetch By ID (Entity-level)
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Chip
            label={actionNames.fetchByIdRequest}
            size="small"
            color="primary"
            variant="outlined"
          />
          <Chip
            label={actionNames.fetchByIdSuccess}
            size="small"
            color="success"
            variant="outlined"
          />
          <Chip
            label={actionNames.fetchByIdFailure}
            size="small"
            color="error"
            variant="outlined"
          />
        </Stack>

        <Typography variant="subtitle2" gutterBottom>
          Create (Operation-level)
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Chip label={actionNames.createRequest} size="small" color="primary" variant="outlined" />
          <Chip label={actionNames.createSuccess} size="small" color="success" variant="outlined" />
          <Chip label={actionNames.createFailure} size="small" color="error" variant="outlined" />
        </Stack>

        <Typography variant="subtitle2" gutterBottom>
          Update (Entity-level)
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Chip label={actionNames.updateRequest} size="small" color="primary" variant="outlined" />
          <Chip label={actionNames.updateSuccess} size="small" color="success" variant="outlined" />
          <Chip label={actionNames.updateFailure} size="small" color="error" variant="outlined" />
        </Stack>

        <Typography variant="subtitle2" gutterBottom>
          Delete (Entity-level)
        </Typography>
        <Stack direction="row" spacing={1}>
          <Chip label={actionNames.deleteRequest} size="small" color="primary" variant="outlined" />
          <Chip label={actionNames.deleteSuccess} size="small" color="success" variant="outlined" />
          <Chip label={actionNames.deleteFailure} size="small" color="error" variant="outlined" />
        </Stack>
      </Paper>

      <StateInspector title="Initial State" state={state} />
    </Box>
  );
}

/**
 * Component demonstrating loading state transitions
 */
function LoadingStatesDemo() {
  const dispatch = useDispatch();
  const state = useSelector((s: { taskPage: TaskPageState }) => s.taskPage);

  const getLoadingChip = (loadingValue: string | undefined) => {
    if (!loadingValue) {
      return <Chip label={LoadingState.Idle} size="small" color="default" />;
    }
    switch (loadingValue) {
      case LoadingState.Pending:
        return <Chip label={LoadingState.Pending} size="small" color="warning" />;
      case LoadingState.Fulfilled:
        return <Chip label={LoadingState.Fulfilled} size="small" color="success" />;
      case LoadingState.Rejected:
        return <Chip label={LoadingState.Rejected} size="small" color="error" />;
      default:
        return <Chip label={loadingValue} size="small" />;
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 800 }}>
      <Typography variant="h6" gutterBottom>
        Loading State Transitions
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Watch how loading states transition: <strong>Idle → Pending → Fulfilled/Rejected</strong>
      </Typography>

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Fetch All (getAll)
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <Button
            size="small"
            variant="contained"
            onClick={() => dispatch(taskPageActions.fetchTasksRequest())}
          >
            Request
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="success"
            onClick={() => dispatch(taskPageActions.fetchTasksSuccess([]))}
          >
            Success
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={() => dispatch(taskPageActions.fetchTasksFailure({ error: 'Network error' }))}
          >
            Failure
          </Button>
          <Box sx={{ ml: 2 }}>
            <Typography variant="caption" color="text.secondary">
              State:{' '}
            </Typography>
            {getLoadingChip(state.loading['getAll'])}
          </Box>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" gutterBottom>
          Create (create)
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <Button
            size="small"
            variant="contained"
            onClick={() =>
              dispatch(taskPageActions.createTaskRequest({ data: { title: 'New Task' } }))
            }
          >
            Request
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="success"
            onClick={() => dispatch(taskPageActions.createTaskSuccess({ id: 'new-task' }))}
          >
            Success
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={() =>
              dispatch(taskPageActions.createTaskFailure({ error: 'Validation failed' }))
            }
          >
            Failure
          </Button>
          <Box sx={{ ml: 2 }}>
            <Typography variant="caption" color="text.secondary">
              State:{' '}
            </Typography>
            {getLoadingChip(state.loading['create'])}
          </Box>
        </Stack>
      </Paper>

      <StateInspector title="Current State" state={state} highlightPath="loading" />
    </Box>
  );
}

/**
 * Component demonstrating entity-level state tracking
 */
function EntityLevelTrackingDemo() {
  const dispatch = useDispatch();
  const state = useSelector((s: { taskPage: TaskPageState }) => s.taskPage);

  const taskIds = ['task-1', 'task-2', 'task-3'];

  const getLoadingChip = (loadingValue: string | undefined) => {
    if (!loadingValue) {
      return <Chip label={LoadingState.Idle} size="small" color="default" />;
    }
    switch (loadingValue) {
      case LoadingState.Pending:
        return <Chip label={LoadingState.Pending} size="small" color="warning" />;
      case LoadingState.Fulfilled:
        return <Chip label={LoadingState.Fulfilled} size="small" color="success" />;
      case LoadingState.Rejected:
        return <Chip label={LoadingState.Rejected} size="small" color="error" />;
      default:
        return <Chip label={loadingValue} size="small" />;
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 900 }}>
      <Typography variant="h6" gutterBottom>
        Entity-Level State Tracking
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Entity-level operations use composite keys like <code>getById:task-1</code> or{' '}
        <code>update:task-2</code> to track per-entity state.
      </Typography>

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Fetch By ID Operations
        </Typography>
        <Stack spacing={1}>
          {taskIds.map((id) => (
            <Stack key={id} direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" sx={{ width: 80 }}>
                {id}
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={() => dispatch(taskPageActions.fetchTaskDetailsRequest({ id }))}
              >
                Fetch
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="success"
                onClick={() => dispatch(taskPageActions.fetchTaskDetailsSuccess({ id }))}
              >
                ✓
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="error"
                onClick={() =>
                  dispatch(taskPageActions.fetchTaskDetailsFailure({ error: 'Not found', id }))
                }
              >
                ✗
              </Button>
              <Box sx={{ ml: 1 }}>{getLoadingChip(state.loading[`getById:${id}`])}</Box>
              {state.errors[`getById:${id}`] && (
                <Typography variant="caption" color="error">
                  {state.errors[`getById:${id}`]}
                </Typography>
              )}
            </Stack>
          ))}
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" gutterBottom>
          Update Operations
        </Typography>
        <Stack spacing={1}>
          {taskIds.map((id) => (
            <Stack key={id} direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" sx={{ width: 80 }}>
                {id}
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={() =>
                  dispatch(taskPageActions.updateTaskRequest({ id, data: { title: 'Updated' } }))
                }
              >
                Update
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="success"
                onClick={() => dispatch(taskPageActions.updateTaskSuccess({ id }))}
              >
                ✓
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="error"
                onClick={() =>
                  dispatch(taskPageActions.updateTaskFailure({ error: 'Update failed', id }))
                }
              >
                ✗
              </Button>
              <Box sx={{ ml: 1 }}>{getLoadingChip(state.loading[`update:${id}`])}</Box>
              {state.errors[`update:${id}`] && (
                <Typography variant="caption" color="error">
                  {state.errors[`update:${id}`]}
                </Typography>
              )}
            </Stack>
          ))}
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" gutterBottom>
          Delete Operations
        </Typography>
        <Stack spacing={1}>
          {taskIds.map((id) => (
            <Stack key={id} direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" sx={{ width: 80 }}>
                {id}
              </Typography>
              <Button
                size="small"
                variant="outlined"
                color="error"
                onClick={() => dispatch(taskPageActions.deleteTaskRequest({ id }))}
              >
                Delete
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="success"
                onClick={() => dispatch(taskPageActions.deleteTaskSuccess({ id }))}
              >
                ✓
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="error"
                onClick={() =>
                  dispatch(taskPageActions.deleteTaskFailure({ error: 'Delete failed', id }))
                }
              >
                ✗
              </Button>
              <Box sx={{ ml: 1 }}>{getLoadingChip(state.loading[`delete:${id}`])}</Box>
              {state.errors[`delete:${id}`] && (
                <Typography variant="caption" color="error">
                  {state.errors[`delete:${id}`]}
                </Typography>
              )}
            </Stack>
          ))}
        </Stack>
      </Paper>

      <StateInspector title="State with Composite Keys" state={state} maxHeight={300} />
    </Box>
  );
}

/**
 * Component demonstrating error handling
 */
function ErrorHandlingDemo() {
  const dispatch = useDispatch();
  const state = useSelector((s: { taskPage: TaskPageState }) => s.taskPage);

  return (
    <Box sx={{ width: '100%', maxWidth: 800 }}>
      <Typography variant="h6" gutterBottom>
        Error Handling
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Errors are tracked separately for operation-level and entity-level operations.
      </Typography>

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Operation-Level Errors
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={() =>
              dispatch(taskPageActions.fetchTasksFailure({ error: 'Failed to fetch tasks' }))
            }
          >
            Fetch All Error
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={() =>
              dispatch(taskPageActions.createTaskFailure({ error: 'Validation failed' }))
            }
          >
            Create Error
          </Button>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" gutterBottom>
          Entity-Level Errors
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={() =>
              dispatch(
                taskPageActions.fetchTaskDetailsFailure({ error: 'Task not found', id: 'task-1' })
              )
            }
          >
            Fetch task-1 Error
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={() =>
              dispatch(
                taskPageActions.updateTaskFailure({ error: 'Permission denied', id: 'task-2' })
              )
            }
          >
            Update task-2 Error
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={() =>
              dispatch(
                taskPageActions.deleteTaskFailure({ error: 'Cannot delete', id: 'task-3' })
              )
            }
          >
            Delete task-3 Error
          </Button>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" gutterBottom>
          Clearing Errors (via Success Actions)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Success actions automatically clear the corresponding error.
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="contained"
            color="success"
            onClick={() => dispatch(taskPageActions.fetchTasksSuccess([]))}
          >
            Clear getAll Error
          </Button>
          <Button
            size="small"
            variant="contained"
            color="success"
            onClick={() => dispatch(taskPageActions.fetchTaskDetailsSuccess({ id: 'task-1' }))}
          >
            Clear task-1 Error
          </Button>
        </Stack>
      </Paper>

      <StateInspector title="Errors State" state={state} highlightPath="errors" />
    </Box>
  );
}

// =============================================================================
// Story Meta
// =============================================================================

const meta: Meta = {
  title: 'Redux/createCrudSlice',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
\`createCrudSlice\` is a factory function that generates Redux slices with standardized CRUD operations.

## Features
- Generates request/success/failure actions for all CRUD operations
- Supports operation-level state (getAll, create) and entity-level state (getById, update, delete)
- Uses composite keys for entity-level tracking (e.g., \`getById:task-1\`)
- Automatic error clearing on success

## Usage
\`\`\`typescript
const taskPageSlice = createCrudSlice({
  name: 'taskPage',
  entityName: 'task',
  entityNamePlural: 'tasks',
});

// Generated actions include:
// - fetchTasksRequest, fetchTasksSuccess, fetchTasksFailure
// - fetchTaskDetailsRequest, fetchTaskDetailsSuccess, fetchTaskDetailsFailure
// - createTaskRequest, createTaskSuccess, createTaskFailure
// - updateTaskRequest, updateTaskSuccess, updateTaskFailure
// - deleteTaskRequest, deleteTaskSuccess, deleteTaskFailure
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;

// =============================================================================
// Stories
// =============================================================================

export const SliceCreation: StoryObj = {
  name: 'Slice Creation',
  render: () => (
    <StoryWrapper>
      <SliceCreationDemo />
    </StoryWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Shows the action names generated by `createCrudSlice` and the initial state structure.',
      },
    },
  },
};

export const LoadingStates: StoryObj = {
  name: 'Loading States',
  render: () => (
    <StoryWrapper>
      <LoadingStatesDemo />
    </StoryWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates loading state transitions: Idle → Pending → Fulfilled/Rejected for operation-level states.',
      },
    },
  },
};

export const EntityLevelTracking: StoryObj = {
  name: 'Entity-Level Tracking',
  render: () => (
    <StoryWrapper>
      <EntityLevelTrackingDemo />
    </StoryWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Shows how entity-level operations (getById, update, delete) use composite keys like `getById:task-1` for per-entity state tracking.',
      },
    },
  },
};

export const ErrorHandling: StoryObj = {
  name: 'Error Handling',
  render: () => (
    <StoryWrapper>
      <ErrorHandlingDemo />
    </StoryWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates error tracking for both operation-level and entity-level operations, and how errors are cleared on success.',
      },
    },
  },
};
