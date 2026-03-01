import { createSlice } from "@reduxjs/toolkit";
import { setPending, setFulfilled, setRejected } from "./sliceHelpers.js";
import { LoadingState } from "../types/loadingState.js";
function createCrudSelectors(sliceSelector) {
  return {
    /**
     * Select loading state for an operation (e.g., 'getAll', 'create')
     */
    selectIsLoading: (operation) => (state) => sliceSelector(state).loading[operation] === LoadingState.Pending,
    /**
     * Select loading state for entity-specific operation
     * Uses composite key format: 'operation:entityId'
     */
    selectIsEntityLoading: (operation, entityId) => (state) => sliceSelector(state).loading[`${operation}:${entityId}`] === LoadingState.Pending,
    /**
     * Select error message for an operation
     */
    selectError: (operation) => (state) => sliceSelector(state).errors[operation] || "",
    /**
     * Select error message for entity-specific operation
     * Uses composite key format: 'operation:entityId'
     */
    selectEntityError: (operation, entityId) => (state) => sliceSelector(state).errors[`${operation}:${entityId}`] || "",
    /**
     * Select loading state value (returns the LoadingState string)
     */
    selectLoadingState: (operation) => (state) => sliceSelector(state).loading[operation] || "",
    /**
     * Select loading state value for entity-specific operation
     */
    selectEntityLoadingState: (operation, entityId) => (state) => sliceSelector(state).loading[`${operation}:${entityId}`] || ""
  };
}
function createCrudSlice(config) {
  const {
    name,
    operations = ["getAll", "getById", "create", "update", "delete"],
    extraReducers = {},
    initialState: customInitialState = {},
    entityName = "entity",
    entityNamePlural = "entities"
  } = config;
  const initialState = {
    query: "",
    errors: {},
    loading: {},
    ...customInitialState
  };
  const reducers = {};
  if (operations.includes("getAll")) {
    const capitalizedPlural = capitalize(entityNamePlural);
    reducers[`fetch${capitalizedPlural}Request`] = (state, _action) => {
      setPending(state, {
        key: "getAll"
      });
    };
    reducers[`fetch${capitalizedPlural}Success`] = (state, _action) => {
      setFulfilled(state, {
        loadingKey: "getAll",
        errorKey: "getAll"
      });
    };
    reducers[`fetch${capitalizedPlural}Failure`] = (state, action) => {
      setRejected(state, {
        loadingKey: "getAll",
        errorKey: "getAll",
        failureMessage: action.payload.error || `Failed to fetch ${entityNamePlural}`
      });
    };
  }
  if (operations.includes("getById")) {
    const capitalizedSingular = capitalize(entityName);
    reducers[`fetch${capitalizedSingular}DetailsRequest`] = (state, action) => {
      const key = `getById:${action.payload.id}`;
      setPending(state, {
        key
      });
    };
    reducers[`fetch${capitalizedSingular}DetailsSuccess`] = (state, action) => {
      const key = `getById:${action.payload.id}`;
      setFulfilled(state, {
        loadingKey: key,
        errorKey: key
      });
    };
    reducers[`fetch${capitalizedSingular}DetailsFailure`] = (state, action) => {
      const key = action.payload.id ? `getById:${action.payload.id}` : "getById";
      setRejected(state, {
        loadingKey: key,
        errorKey: key,
        failureMessage: action.payload.error || `Failed to fetch ${entityName} details`
      });
    };
  }
  if (operations.includes("create")) {
    const capitalizedSingular = capitalize(entityName);
    reducers[`create${capitalizedSingular}Request`] = (state, _action) => {
      setPending(state, {
        key: "create"
      });
    };
    reducers[`create${capitalizedSingular}Success`] = (state, _action) => {
      setFulfilled(state, {
        loadingKey: "create",
        errorKey: "create"
      });
    };
    reducers[`create${capitalizedSingular}Failure`] = (state, action) => {
      setRejected(state, {
        loadingKey: "create",
        errorKey: "create",
        failureMessage: action.payload.error || `Failed to create ${entityName}`
      });
    };
  }
  if (operations.includes("update")) {
    const capitalizedSingular = capitalize(entityName);
    reducers[`update${capitalizedSingular}Request`] = (state, action) => {
      const key = `update:${action.payload.id}`;
      setPending(state, {
        key
      });
    };
    reducers[`update${capitalizedSingular}Success`] = (state, action) => {
      const key = `update:${action.payload.id}`;
      setFulfilled(state, {
        loadingKey: key,
        errorKey: key
      });
    };
    reducers[`update${capitalizedSingular}Failure`] = (state, action) => {
      const key = action.payload.id ? `update:${action.payload.id}` : "update";
      setRejected(state, {
        loadingKey: key,
        errorKey: key,
        failureMessage: action.payload.error || `Failed to update ${entityName}`
      });
    };
  }
  if (operations.includes("delete")) {
    const capitalizedSingular = capitalize(entityName);
    reducers[`delete${capitalizedSingular}Request`] = (state, action) => {
      const key = `delete:${action.payload.id}`;
      setPending(state, {
        key
      });
    };
    reducers[`delete${capitalizedSingular}Success`] = (state, action) => {
      const key = `delete:${action.payload.id}`;
      setFulfilled(state, {
        loadingKey: key,
        errorKey: key
      });
    };
    reducers[`delete${capitalizedSingular}Failure`] = (state, action) => {
      const key = action.payload.id ? `delete:${action.payload.id}` : "delete";
      setRejected(state, {
        loadingKey: key,
        errorKey: key,
        failureMessage: action.payload.error || `Failed to delete ${entityName}`
      });
    };
  }
  const allReducers = {
    ...reducers,
    ...extraReducers
  };
  return createSlice({
    name,
    initialState,
    reducers: allReducers
  });
}
function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}
function getCrudActionNames(entityName, entityNamePlural) {
  const capitalizedSingular = capitalize(entityName);
  const capitalizedPlural = capitalize(entityNamePlural);
  return {
    // Fetch all
    fetchRequest: `fetch${capitalizedPlural}Request`,
    fetchSuccess: `fetch${capitalizedPlural}Success`,
    fetchFailure: `fetch${capitalizedPlural}Failure`,
    // Fetch by ID
    fetchByIdRequest: `fetch${capitalizedSingular}DetailsRequest`,
    fetchByIdSuccess: `fetch${capitalizedSingular}DetailsSuccess`,
    fetchByIdFailure: `fetch${capitalizedSingular}DetailsFailure`,
    // Create
    createRequest: `create${capitalizedSingular}Request`,
    createSuccess: `create${capitalizedSingular}Success`,
    createFailure: `create${capitalizedSingular}Failure`,
    // Update
    updateRequest: `update${capitalizedSingular}Request`,
    updateSuccess: `update${capitalizedSingular}Success`,
    updateFailure: `update${capitalizedSingular}Failure`,
    // Delete
    deleteRequest: `delete${capitalizedSingular}Request`,
    deleteSuccess: `delete${capitalizedSingular}Success`,
    deleteFailure: `delete${capitalizedSingular}Failure`
  };
}
export {
  createCrudSelectors,
  createCrudSlice,
  getCrudActionNames
};
//# sourceMappingURL=index.js.map
