import { EntityAdapter, Slice, SliceCaseReducers, EntityState } from '@reduxjs/toolkit';
interface EntityModuleState extends EntityState<unknown, string> {
    loading: boolean;
    error: string | null;
}
interface EntityModule<T, S extends EntityModuleState = EntityModuleState, CaseReducers extends SliceCaseReducers<S> = SliceCaseReducers<S>> {
    adapter: EntityAdapter<T, string>;
    slice: Slice<S, CaseReducers>;
    actions: Slice<S, CaseReducers>['actions'];
    reducer: Slice<S, CaseReducers>['reducer'];
    selectors: ReturnType<EntityAdapter<T, string>['getSelectors']>;
}
/**
 * Factory function to create a normalized entity Redux module.
 *
 * Creates an entity adapter with standard CRUD actions:
 * - addOne, addMany, setAll
 * - updateOne, updateMany
 * - removeOne, removeMany
 * - setLoading, setError
 *
 * Also provides memoized selectors:
 * - selectAll, selectById, selectIds, selectEntities
 *
 * @param entityName - Name of the entity (used as slice name and for state path)
 * @param selectId - Optional custom ID selector (defaults to entity.id)
 * @param sortComparer - Optional sort comparer for ordered storage
 *
 * @example
 * ```typescript
 * export const postsModule = createEntityModule<Post>('posts', (p) => p.id);
 * export const postsActions = postsModule.actions;
 * export const postsReducer = postsModule.reducer;
 * export const postsSelectors = postsModule.selectors;
 * ```
 */
export declare function createEntityModule<T extends {
    id: string;
}>(entityName: string, selectId?: (entity: T) => string, sortComparer?: (a: T, b: T) => number): EntityModule<T>;
export {};
//# sourceMappingURL=index.d.ts.map