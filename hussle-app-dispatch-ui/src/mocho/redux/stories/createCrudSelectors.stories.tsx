/**
 * createCrudSelectors Stories
 *
 * Interactive demos showing how createCrudSelectors works,
 * including operation-level and entity-level selectors.
 */

import React, { useMemo } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Provider, useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Button,
  Stack,
  Typography,
  Chip,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { configureStore } from '@reduxjs/toolkit';

import { createCrudSlice, createCrudSelectors, CrudPageState } from '../createCrudSlice';
import { LoadingState } from '../types/loadingState';
import { StateInspector } from './components/StateInspector';
import type { CreateTaskInput, UpdateTaskInput, TaskPageState } from './mocks/types';

// =============================================================================
// Demo Slice and Selectors Setup
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
 * Root state type for demo
 */
interface DemoRootState {
  taskPage: TaskPageState;
}

/**
 * Create selectors for the task page slice
 */
const taskSelectors = createCrudSelectors<DemoRootState>((state) => state.taskPage);

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
 * Component showing basic selector usage
 */
function BasicSelectorsDemo() {
  const dispatch = useDispatch();
  const state = useSelector((s: DemoRootState) => s.taskPage);

  // Using the selectors
  const isLoadingGetAll = useSelector(taskSelectors.selectIsLoading('getAll'));
  const isLoadingCreate = useSelector(taskSelectors.selectIsLoading('create'));
  const errorGetAll = useSelector(taskSelectors.selectError('getAll'));
  const errorCreate = useSelector(taskSelectors.selectError('create'));

  return (
    <Box sx={{ width: '100%', maxWidth: 900 }}>
      <Typography variant="h6" gutterBottom>
        Basic Selectors (Operation-Level)
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        <code>selectIsLoading</code> and <code>selectError</code> return boolean and string values
        for operation-level state.
      </Typography>

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Selector Usage
        </Typography>
        <Box
          component="pre"
          sx={{
            p: 1.5,
            backgroundColor: 'grey.100',
            borderRadius: 1,
            fontSize: '0.75rem',
            overflow: 'auto',
            mb: 2,
          }}
        >
          {`const isLoading = useSelector(taskSelectors.selectIsLoading('getAll'));
const error = useSelector(taskSelectors.selectError('getAll'));`}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" gutterBottom>
          Dispatch Actions
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Button
            size="small"
            variant="contained"
            onClick={() => dispatch(taskPageActions.fetchTasksRequest())}
          >
            Fetch Tasks
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
        </Stack>
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Button
            size="small"
            variant="contained"
            onClick={() =>
              dispatch(taskPageActions.createTaskRequest({ data: { title: 'New Task' } }))
            }
          >
            Create Task
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="success"
            onClick={() => dispatch(taskPageActions.createTaskSuccess({ id: 'new' }))}
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
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" gutterBottom>
          Selector Results
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Selector</TableCell>
                <TableCell>Value</TableCell>
                <TableCell>Type</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>
                  <code>selectIsLoading('getAll')</code>
                </TableCell>
                <TableCell>
                  <Chip
                    label={isLoadingGetAll ? 'true' : 'false'}
                    size="small"
                    color={isLoadingGetAll ? 'warning' : 'default'}
                  />
                </TableCell>
                <TableCell>boolean</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <code>selectIsLoading('create')</code>
                </TableCell>
                <TableCell>
                  <Chip
                    label={isLoadingCreate ? 'true' : 'false'}
                    size="small"
                    color={isLoadingCreate ? 'warning' : 'default'}
                  />
                </TableCell>
                <TableCell>boolean</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <code>selectError('getAll')</code>
                </TableCell>
                <TableCell>
                  {errorGetAll ? (
                    <Chip label={errorGetAll} size="small" color="error" />
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      (empty string)
                    </Typography>
                  )}
                </TableCell>
                <TableCell>string</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <code>selectError('create')</code>
                </TableCell>
                <TableCell>
                  {errorCreate ? (
                    <Chip label={errorCreate} size="small" color="error" />
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      (empty string)
                    </Typography>
                  )}
                </TableCell>
                <TableCell>string</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <StateInspector title="Raw State" state={state} />
    </Box>
  );
}

/**
 * Component showing entity-level selector usage
 */
function EntityLevelSelectorsDemo() {
  const dispatch = useDispatch();
  const state = useSelector((s: DemoRootState) => s.taskPage);

  const taskIds = ['task-1', 'task-2', 'task-3'];

  // Get loading/error for each task
  const getTaskLoading = (id: string) =>
    useSelector(taskSelectors.selectIsEntityLoading('getById', id));
  const getTaskError = (id: string) => useSelector(taskSelectors.selectEntityError('getById', id));

  return (
    <Box sx={{ width: '100%', maxWidth: 900 }}>
      <Typography variant="h6" gutterBottom>
        Entity-Level Selectors
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        <code>selectIsEntityLoading</code> and <code>selectEntityError</code> use composite keys to
        track per-entity state.
      </Typography>

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Selector Usage
        </Typography>
        <Box
          component="pre"
          sx={{
            p: 1.5,
            backgroundColor: 'grey.100',
            borderRadius: 1,
            fontSize: '0.75rem',
            overflow: 'auto',
            mb: 2,
          }}
        >
          {`const isLoading = useSelector(taskSelectors.selectIsEntityLoading('getById', taskId));
const error = useSelector(taskSelectors.selectEntityError('update', taskId));`}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" gutterBottom>
          Entity Operations & Results
        </Typography>

        <TableContainer sx={{ mb: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Entity ID</TableCell>
                <TableCell>Actions</TableCell>
                <TableCell>Loading</TableCell>
                <TableCell>Error</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {taskIds.map((id) => {
                const isLoading = useSelector(
                  taskSelectors.selectIsEntityLoading('getById', id)
                );
                const error = useSelector(taskSelectors.selectEntityError('getById', id));
                return (
                  <TableRow key={id}>
                    <TableCell>{id}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() =>
                            dispatch(taskPageActions.fetchTaskDetailsRequest({ id }))
                          }
                        >
                          Fetch
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="success"
                          onClick={() =>
                            dispatch(taskPageActions.fetchTaskDetailsSuccess({ id }))
                          }
                        >
                          ✓
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() =>
                            dispatch(
                              taskPageActions.fetchTaskDetailsFailure({
                                error: 'Not found',
                                id,
                              })
                            )
                          }
                        >
                          ✗
                        </Button>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={isLoading ? 'true' : 'false'}
                        size="small"
                        color={isLoading ? 'warning' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      {error ? (
                        <Chip label={error} size="small" color="error" />
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          (none)
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <StateInspector title="State with Composite Keys" state={state} />
    </Box>
  );
}

/**
 * Component showing LoadingState enum value access
 */
function LoadingStateEnumDemo() {
  const dispatch = useDispatch();
  const state = useSelector((s: DemoRootState) => s.taskPage);

  // Using selectLoadingState to get the raw enum value
  const getAllLoadingState = useSelector(taskSelectors.selectLoadingState('getAll'));
  const createLoadingState = useSelector(taskSelectors.selectLoadingState('create'));

  const getLoadingChip = (loadingState: string) => {
    if (!loadingState) {
      return <Chip label={LoadingState.Idle} size="small" color="default" variant="outlined" />;
    }
    switch (loadingState) {
      case LoadingState.Pending:
        return <Chip label={LoadingState.Pending} size="small" color="warning" />;
      case LoadingState.Fulfilled:
        return <Chip label={LoadingState.Fulfilled} size="small" color="success" />;
      case LoadingState.Rejected:
        return <Chip label={LoadingState.Rejected} size="small" color="error" />;
      default:
        return <Chip label={loadingState} size="small" />;
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 900 }}>
      <Typography variant="h6" gutterBottom>
        LoadingState Enum Access
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        <code>selectLoadingState</code> returns the raw <code>LoadingState</code> enum value instead
        of a boolean.
      </Typography>

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          LoadingState Enum Values
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Chip label={LoadingState.Idle} size="small" color="default" variant="outlined" />
          <Chip label={LoadingState.Pending} size="small" color="warning" />
          <Chip label={LoadingState.Fulfilled} size="small" color="success" />
          <Chip label={LoadingState.Rejected} size="small" color="error" />
        </Stack>

        <Typography variant="subtitle2" gutterBottom>
          Selector Usage
        </Typography>
        <Box
          component="pre"
          sx={{
            p: 1.5,
            backgroundColor: 'grey.100',
            borderRadius: 1,
            fontSize: '0.75rem',
            overflow: 'auto',
            mb: 2,
          }}
        >
          {`const loadingState = useSelector(taskSelectors.selectLoadingState('getAll'));
// Returns: 'Idle' | 'Pending' | 'Fulfilled' | 'Rejected' | ''

const entityLoadingState = useSelector(
  taskSelectors.selectEntityLoadingState('update', taskId)
);`}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" gutterBottom>
          Dispatch Actions
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Button
            size="small"
            variant="contained"
            onClick={() => dispatch(taskPageActions.fetchTasksRequest())}
          >
            Fetch Tasks (Request)
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
            onClick={() => dispatch(taskPageActions.fetchTasksFailure({ error: 'Error' }))}
          >
            Failure
          </Button>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" gutterBottom>
          Current Loading States
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Selector</TableCell>
                <TableCell>Raw Value</TableCell>
                <TableCell>Display</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>
                  <code>selectLoadingState('getAll')</code>
                </TableCell>
                <TableCell>
                  <code>"{getAllLoadingState || 'Idle'}"</code>
                </TableCell>
                <TableCell>{getLoadingChip(getAllLoadingState)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <code>selectLoadingState('create')</code>
                </TableCell>
                <TableCell>
                  <code>"{createLoadingState || 'Idle'}"</code>
                </TableCell>
                <TableCell>{getLoadingChip(createLoadingState)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <StateInspector title="Raw State" state={state} highlightPath="loading" />
    </Box>
  );
}

// =============================================================================
// Story Meta
// =============================================================================

const meta: Meta = {
  title: 'Redux/createCrudSelectors',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
\`createCrudSelectors\` creates typed selector functions for accessing CRUD loading and error states.

## Available Selectors

| Selector | Returns | Description |
|----------|---------|-------------|
| \`selectIsLoading(operation)\` | boolean | Is operation currently loading? |
| \`selectError(operation)\` | string | Error message for operation |
| \`selectLoadingState(operation)\` | LoadingState | Raw enum value |
| \`selectIsEntityLoading(op, id)\` | boolean | Is entity-specific operation loading? |
| \`selectEntityError(op, id)\` | string | Error message for entity operation |
| \`selectEntityLoadingState(op, id)\` | LoadingState | Raw enum value for entity |

## Usage
\`\`\`typescript
const taskSelectors = createCrudSelectors<RootState>(
  (state) => state.taskPage
);

// In components
const isLoading = useSelector(taskSelectors.selectIsLoading('getAll'));
const error = useSelector(taskSelectors.selectError('getAll'));
const isTaskLoading = useSelector(taskSelectors.selectIsEntityLoading('getById', taskId));
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

export const BasicSelectors: StoryObj = {
  name: 'Basic Selectors',
  render: () => (
    <StoryWrapper>
      <BasicSelectorsDemo />
    </StoryWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Shows `selectIsLoading` and `selectError` for operation-level state (getAll, create).',
      },
    },
  },
};

export const EntityLevelSelectors: StoryObj = {
  name: 'Entity-Level Selectors',
  render: () => (
    <StoryWrapper>
      <EntityLevelSelectorsDemo />
    </StoryWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates `selectIsEntityLoading` and `selectEntityError` for per-entity state tracking.',
      },
    },
  },
};

export const LoadingStateEnum: StoryObj = {
  name: 'LoadingState Enum',
  render: () => (
    <StoryWrapper>
      <LoadingStateEnumDemo />
    </StoryWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Shows `selectLoadingState` and `selectEntityLoadingState` which return the raw LoadingState enum value.',
      },
    },
  },
};
