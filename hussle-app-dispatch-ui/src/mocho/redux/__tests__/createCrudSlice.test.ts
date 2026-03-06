import {
  createCrudSlice,
  createCrudSelectors,
  getCrudActionNames,
  CrudPageState,
} from '../createCrudSlice';
import { LoadingState } from '../types/loadingState';

describe('createCrudSlice', () => {
  describe('slice creation', () => {
    it('creates a slice with the specified name', () => {
      const slice = createCrudSlice({
        name: 'testPage',
        entityName: 'post',
        entityNamePlural: 'posts',
      });

      expect(slice.name).toBe('testPage');
    });

    it('creates initial state with empty loading and errors', () => {
      const slice = createCrudSlice({
        name: 'testPage',
        entityName: 'post',
        entityNamePlural: 'posts',
      });

      expect(slice.getInitialState()).toEqual({
        query: '',
        loading: {},
        errors: {},
      });
    });

    it('merges custom initial state', () => {
      const slice = createCrudSlice({
        name: 'testPage',
        entityName: 'post',
        entityNamePlural: 'posts',
        initialState: { query: 'initial query' },
      });

      expect(slice.getInitialState().query).toBe('initial query');
    });
  });

  describe('action names', () => {
    it('generates all CRUD action creators with static names', () => {
      const slice = createCrudSlice({
        name: 'testPage',
        entityName: 'post',
        entityNamePlural: 'posts',
      });

      expect(slice.actions.fetchAllRequest).toBeDefined();
      expect(slice.actions.fetchAllSuccess).toBeDefined();
      expect(slice.actions.fetchAllFailure).toBeDefined();
      expect(slice.actions.fetchByIdRequest).toBeDefined();
      expect(slice.actions.fetchByIdSuccess).toBeDefined();
      expect(slice.actions.fetchByIdFailure).toBeDefined();
      expect(slice.actions.createRequest).toBeDefined();
      expect(slice.actions.createSuccess).toBeDefined();
      expect(slice.actions.createFailure).toBeDefined();
      expect(slice.actions.updateRequest).toBeDefined();
      expect(slice.actions.updateSuccess).toBeDefined();
      expect(slice.actions.updateFailure).toBeDefined();
      expect(slice.actions.deleteRequest).toBeDefined();
      expect(slice.actions.deleteSuccess).toBeDefined();
      expect(slice.actions.deleteFailure).toBeDefined();
    });
  });

  describe('selective operations', () => {
    it('only generates actions for specified operations', () => {
      const slice = createCrudSlice({
        name: 'testPage',
        entityName: 'item',
        entityNamePlural: 'items',
        operations: ['getAll', 'create'],
      });

      // Should exist
      expect(slice.actions.fetchAllRequest).toBeDefined();
      expect(slice.actions.createRequest).toBeDefined();

      // Should not exist
      expect(slice.actions.fetchByIdRequest).toBeUndefined();
      expect(slice.actions.updateRequest).toBeUndefined();
      expect(slice.actions.deleteRequest).toBeUndefined();
    });
  });

  describe('fetchAll (getAll) reducers', () => {
    const slice = createCrudSlice({
      name: 'postPage',
      entityName: 'post',
      entityNamePlural: 'posts',
    });
    const { reducer } = slice;

    it('sets loading to Pending on fetchAllRequest', () => {
      const state = reducer(undefined, slice.actions.fetchAllRequest());

      expect(state.loading['getAll']).toBe(LoadingState.Pending);
    });

    it('sets loading to Fulfilled and clears error on fetchAllSuccess', () => {
      const initialState: CrudPageState = {
        query: '',
        loading: { getAll: LoadingState.Pending },
        errors: { getAll: 'previous error' },
      };

      const state = reducer(initialState, slice.actions.fetchAllSuccess([]));

      expect(state.loading['getAll']).toBe(LoadingState.Fulfilled);
      expect(state.errors['getAll']).toBe('');
    });

    it('sets loading to Rejected and stores error on fetchAllFailure', () => {
      const initialState: CrudPageState = {
        query: '',
        loading: { getAll: LoadingState.Pending },
        errors: {},
      };

      const state = reducer(
        initialState,
        slice.actions.fetchAllFailure({ error: 'Network error' })
      );

      expect(state.loading['getAll']).toBe(LoadingState.Rejected);
      expect(state.errors['getAll']).toBe('Network error');
    });

    it('uses default error message when none provided', () => {
      const state = reducer(
        undefined,
        slice.actions.fetchAllFailure({ error: '' })
      );

      expect(state.errors['getAll']).toBe('Failed to fetch posts');
    });
  });

  describe('fetchById (getById) reducers - entity-level', () => {
    const slice = createCrudSlice({
      name: 'postPage',
      entityName: 'post',
      entityNamePlural: 'posts',
    });
    const { reducer } = slice;

    it('sets entity-specific loading state on request', () => {
      const state = reducer(
        undefined,
        slice.actions.fetchByIdRequest({ id: '123' })
      );

      expect(state.loading['getById:123']).toBe(LoadingState.Pending);
      expect(state.loading['getById:456']).toBeUndefined();
    });

    it('sets entity-specific loading to Fulfilled on success', () => {
      const initialState: CrudPageState = {
        query: '',
        loading: { 'getById:123': LoadingState.Pending },
        errors: {},
      };

      const state = reducer(
        initialState,
        slice.actions.fetchByIdSuccess({ id: '123' })
      );

      expect(state.loading['getById:123']).toBe(LoadingState.Fulfilled);
    });

    it('sets entity-specific error on failure with id', () => {
      const state = reducer(
        undefined,
        slice.actions.fetchByIdFailure({ error: 'Not found', id: '123' })
      );

      expect(state.loading['getById:123']).toBe(LoadingState.Rejected);
      expect(state.errors['getById:123']).toBe('Not found');
    });

    it('uses generic key when id not provided in failure', () => {
      const state = reducer(
        undefined,
        slice.actions.fetchByIdFailure({ error: 'Server error' })
      );

      expect(state.loading['getById']).toBe(LoadingState.Rejected);
      expect(state.errors['getById']).toBe('Server error');
    });
  });

  describe('create reducers', () => {
    const slice = createCrudSlice({
      name: 'authorPage',
      entityName: 'author',
      entityNamePlural: 'authors',
    });
    const { reducer } = slice;

    it('sets create loading to Pending on request', () => {
      const state = reducer(
        undefined,
        slice.actions.createRequest({ data: { name: 'John' } })
      );

      expect(state.loading['create']).toBe(LoadingState.Pending);
    });

    it('sets create loading to Fulfilled on success', () => {
      const initialState: CrudPageState = {
        query: '',
        loading: { create: LoadingState.Pending },
        errors: {},
      };

      const state = reducer(
        initialState,
        slice.actions.createSuccess({ id: 'new-id' })
      );

      expect(state.loading['create']).toBe(LoadingState.Fulfilled);
    });

    it('sets create error on failure', () => {
      const state = reducer(
        undefined,
        slice.actions.createFailure({ error: 'Validation failed' })
      );

      expect(state.loading['create']).toBe(LoadingState.Rejected);
      expect(state.errors['create']).toBe('Validation failed');
    });
  });

  describe('update reducers - entity-level', () => {
    const slice = createCrudSlice({
      name: 'postPage',
      entityName: 'post',
      entityNamePlural: 'posts',
    });
    const { reducer } = slice;

    it('sets entity-specific update loading on request', () => {
      const state = reducer(
        undefined,
        slice.actions.updateRequest({ id: 'abc', data: { title: 'New' } })
      );

      expect(state.loading['update:abc']).toBe(LoadingState.Pending);
    });

    it('sets entity-specific update loading to Fulfilled on success', () => {
      const initialState: CrudPageState = {
        query: '',
        loading: { 'update:abc': LoadingState.Pending },
        errors: {},
      };

      const state = reducer(
        initialState,
        slice.actions.updateSuccess({ id: 'abc' })
      );

      expect(state.loading['update:abc']).toBe(LoadingState.Fulfilled);
    });

    it('sets entity-specific update error on failure', () => {
      const state = reducer(
        undefined,
        slice.actions.updateFailure({ error: 'Update failed', id: 'abc' })
      );

      expect(state.loading['update:abc']).toBe(LoadingState.Rejected);
      expect(state.errors['update:abc']).toBe('Update failed');
    });
  });

  describe('delete reducers - entity-level', () => {
    const slice = createCrudSlice({
      name: 'postPage',
      entityName: 'post',
      entityNamePlural: 'posts',
    });
    const { reducer } = slice;

    it('sets entity-specific delete loading on request', () => {
      const state = reducer(
        undefined,
        slice.actions.deleteRequest({ id: 'xyz' })
      );

      expect(state.loading['delete:xyz']).toBe(LoadingState.Pending);
    });

    it('sets entity-specific delete loading to Fulfilled on success', () => {
      const initialState: CrudPageState = {
        query: '',
        loading: { 'delete:xyz': LoadingState.Pending },
        errors: {},
      };

      const state = reducer(
        initialState,
        slice.actions.deleteSuccess({ id: 'xyz' })
      );

      expect(state.loading['delete:xyz']).toBe(LoadingState.Fulfilled);
    });

    it('sets entity-specific delete error on failure', () => {
      const state = reducer(
        undefined,
        slice.actions.deleteFailure({ error: 'Cannot delete', id: 'xyz' })
      );

      expect(state.loading['delete:xyz']).toBe(LoadingState.Rejected);
      expect(state.errors['delete:xyz']).toBe('Cannot delete');
    });
  });

  describe('extra reducers', () => {
    it('includes extra reducers in the slice', () => {
      const slice = createCrudSlice({
        name: 'testPage',
        entityName: 'item',
        entityNamePlural: 'items',
        extraReducers: {
          setQuery: (state, action: { payload: string }) => {
            state.query = action.payload;
          },
        },
      });

      expect(slice.actions.setQuery).toBeDefined();

      const state = slice.reducer(undefined, slice.actions.setQuery('search term'));
      expect(state.query).toBe('search term');
    });
  });
});

describe('createCrudSelectors', () => {
  interface RootState {
    page: CrudPageState;
  }

  const selectors = createCrudSelectors<RootState>((state) => state.page);

  describe('selectIsLoading', () => {
    it('returns true when operation is Pending', () => {
      const state: RootState = {
        page: {
          query: '',
          loading: { getAll: LoadingState.Pending },
          errors: {},
        },
      };

      expect(selectors.selectIsLoading('getAll')(state)).toBe(true);
    });

    it('returns false when operation is not Pending', () => {
      const state: RootState = {
        page: {
          query: '',
          loading: { getAll: LoadingState.Fulfilled },
          errors: {},
        },
      };

      expect(selectors.selectIsLoading('getAll')(state)).toBe(false);
    });

    it('returns false when operation has no state', () => {
      const state: RootState = {
        page: { query: '', loading: {}, errors: {} },
      };

      expect(selectors.selectIsLoading('getAll')(state)).toBe(false);
    });
  });

  describe('selectIsEntityLoading', () => {
    it('returns true when entity operation is Pending', () => {
      const state: RootState = {
        page: {
          query: '',
          loading: { 'getById:123': LoadingState.Pending },
          errors: {},
        },
      };

      expect(selectors.selectIsEntityLoading('getById', '123')(state)).toBe(true);
    });

    it('returns false for different entity id', () => {
      const state: RootState = {
        page: {
          query: '',
          loading: { 'getById:123': LoadingState.Pending },
          errors: {},
        },
      };

      expect(selectors.selectIsEntityLoading('getById', '456')(state)).toBe(false);
    });
  });

  describe('selectError', () => {
    it('returns error message for operation', () => {
      const state: RootState = {
        page: {
          query: '',
          loading: {},
          errors: { getAll: 'Network error' },
        },
      };

      expect(selectors.selectError('getAll')(state)).toBe('Network error');
    });

    it('returns empty string when no error', () => {
      const state: RootState = {
        page: { query: '', loading: {}, errors: {} },
      };

      expect(selectors.selectError('getAll')(state)).toBe('');
    });
  });

  describe('selectEntityError', () => {
    it('returns error message for entity operation', () => {
      const state: RootState = {
        page: {
          query: '',
          loading: {},
          errors: { 'update:abc': 'Update failed' },
        },
      };

      expect(selectors.selectEntityError('update', 'abc')(state)).toBe('Update failed');
    });
  });

  describe('selectLoadingState', () => {
    it('returns the loading state value', () => {
      const state: RootState = {
        page: {
          query: '',
          loading: { create: LoadingState.Fulfilled },
          errors: {},
        },
      };

      expect(selectors.selectLoadingState('create')(state)).toBe(LoadingState.Fulfilled);
    });
  });

  describe('selectEntityLoadingState', () => {
    it('returns entity-specific loading state value', () => {
      const state: RootState = {
        page: {
          query: '',
          loading: { 'delete:xyz': LoadingState.Rejected },
          errors: {},
        },
      };

      expect(selectors.selectEntityLoadingState('delete', 'xyz')(state)).toBe(
        LoadingState.Rejected
      );
    });
  });
});

describe('getCrudActionNames', () => {
  it('returns correct action names for entity', () => {
    const names = getCrudActionNames('post', 'posts');

    expect(names).toEqual({
      fetchRequest: 'fetchPostsRequest',
      fetchSuccess: 'fetchPostsSuccess',
      fetchFailure: 'fetchPostsFailure',
      fetchByIdRequest: 'fetchPostDetailsRequest',
      fetchByIdSuccess: 'fetchPostDetailsSuccess',
      fetchByIdFailure: 'fetchPostDetailsFailure',
      createRequest: 'createPostRequest',
      createSuccess: 'createPostSuccess',
      createFailure: 'createPostFailure',
      updateRequest: 'updatePostRequest',
      updateSuccess: 'updatePostSuccess',
      updateFailure: 'updatePostFailure',
      deleteRequest: 'deletePostRequest',
      deleteSuccess: 'deletePostSuccess',
      deleteFailure: 'deletePostFailure',
    });
  });

  it('capitalizes entity names correctly', () => {
    const names = getCrudActionNames('category', 'categories');

    expect(names.fetchRequest).toBe('fetchCategoriesRequest');
    expect(names.createRequest).toBe('createCategoryRequest');
  });
});
