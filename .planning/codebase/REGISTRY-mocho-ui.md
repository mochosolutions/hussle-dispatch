# Registry: @mocho/ui

**Scanned:** 2026-03-01 | **Package:** mocho-ui | **Version:** 0.1.0 | **Type:** shared-ui

Unified shared UI library for Mocho Solutions React applications. Provides pre-built components, hooks, Redux utilities, form infrastructure, theming system, and common utilities for admin dashboards and internal tools.

---

## Exported Components

| Component | Path | Signature | Purpose |
|-----------|------|-----------|---------|
| **MainCard** | `mocho-ui/src/components/MainCard` | `export interface MainCardProps { border?: boolean; boxShadow?: boolean; children?: ReactNode; subheader?: ReactNode; style?: CSSProperties; content?: boolean; contentSX?: CardContentProps['sx']; darkTitle?: boolean; divider?: boolean; sx?: CardProps['sx']; secondary?: CardHeaderProps['action']; shadow?: string; elevation?: number; title?: ReactNode; modal?: boolean; }` | Styled card wrapper with title, subtitle, actions; core container for dashboard sections |
| **PageHeader** | `mocho-ui/src/components/PageHeader` | `export interface PageHeaderProps { showBackButton?: boolean; onNavigate?: () => void; title: string; subtitle?: string; headerActions?: React.ReactNode; }` | Page heading with optional back button and action slots |
| **DynamicForm** | `mocho-ui/src/components/DynamicForm` | `function DynamicForm<TFormValues>({ structure, values, touched, errors, handleChange, handleBlur, setFieldValue }: { structure: FormStructure; values: TFormValues; ... })` | Type-safe dynamic form renderer with discriminated union field types; supports flat/sectioned layouts with Accordion collapsible sections |
| **FormDialog** | `mocho-ui/src/components/FormDialog` | Wraps DynamicForm in Material-UI Dialog | Modal form for create/edit operations |
| **ConfirmDialog** | `mocho-ui/src/components/ConfirmDialog` | `export interface ConfirmDialogProps { ... }` | Confirmation dialog for user actions |
| **ConfirmDeleteDialog** | `mocho-ui/src/components/ConfirmDeleteDialog` | Built on ConfirmDialog | Pre-configured delete confirmation modal |
| **EmptyState** | `mocho-ui/src/components/EmptyState` | `export interface EmptyStateProps { icon?: React.ReactNode \| string; title?: string; message?: string; actionText?: string; onAction?: () => void; secondaryActionText?: string; onSecondaryAction?: () => void; minHeight?: number \| string; variant?: 'no-data' \| 'no-search' \| 'error' \| 'loading'; }` | Placeholder for empty lists with icon, message, and action buttons |
| **ErrorState** | `mocho-ui/src/components/ErrorState` | Renders error message with retry button | Error feedback UI |
| **PageLoader** | `mocho-ui/src/components/PageLoader` | Simple loader component | Full-page loading indicator |
| **Loader** | `mocho-ui/src/components/Loadable/Loader` | Re-exported from Loadable | Inline loading spinner |
| **ErrorBoundary** | `mocho-ui/src/components/ErrorBoundary` | React error boundary component | Error boundary wrapper for fault tolerance |
| **ListSkeleton** | `mocho-ui/src/components/SkeletonLoader` | MUI Skeleton list placeholder | Loading skeleton for lists |
| **FormSkeleton** | `mocho-ui/src/components/SkeletonLoader` | MUI Skeleton form fields | Loading skeleton for forms |
| **Loadable** | `mocho-ui/src/components/Loadable` | React.lazy + Suspense wrapper | Code-split component loader |
| **AnimateButton** | `mocho-ui/src/components/extended/AnimateButton` | Framer Motion wrapper | Button with animation on interaction |
| **Avatar** | `mocho-ui/src/components/extended/Avatar` | MUI Avatar extended | Custom avatar with size/type variants |
| **IconButton** | `mocho-ui/src/components/extended/IconButton` | Extended MUI IconButton | Button with icon variants |
| **LoadingButton** | `mocho-ui/src/components/extended/LoadingButton` | MUI LoadingButton wrapper | Button with loading state |
| **Dot** | `mocho-ui/src/components/extended/Dot` | Circular status indicator | Status dot badge |
| **Tooltip** | `mocho-ui/src/components/extended/Tooltip` | MUI Tooltip extended | Custom tooltip wrapper |
| **Breadcrumbs** | `mocho-ui/src/components/extended/Breadcrumbs` | `export interface BreadcrumbItem { ... }` | Navigation breadcrumb trail |
| **Transitions** | `mocho-ui/src/components/extended/Transitions` | Framer Motion animation presets | Pre-configured animation transitions |
| **Snackbar** | `mocho-ui/src/components/extended/Snackbar` | `export interface SnackbarProps { ... }` | Toast notification wrapper |
| **ScrollX** | `mocho-ui/src/components/ScrollX` | Horizontal scroll wrapper | Enables horizontal scrolling for tables |
| **Notistack** | `mocho-ui/src/components/third-party/Notistack` | `export interface NotistackProps { ... }` | Notistack toast integration |
| **SimpleBar** | `mocho-ui/src/components/third-party/SimpleBar` | Simplebar wrapper | Custom scrollbar wrapper |
| **FormattedMessage** | `mocho-ui/src/components/third-party/FormattedMessage` | react-intl FormattedMessage | i18n message renderer |
| **TiptapEditor** | `mocho-ui/src/components/TiptapEditor` | `export interface TiptapEditorProps { ... }` | Rich text editor with Tiptap; supports images, links, formatting |
| **Logo** | `mocho-ui/src/components/Logo` | `export interface LogoProps { ... }` | Branding logo component |
| **PageWrapper** | `mocho-ui/src/components/PageWrapper` | Flex container wrapper | Page-level flex container |
| **MainLayout** | `mocho-ui/src/components/layout/MainLayout` | Layout with drawer/sidebar | Admin layout with navigation drawer |
| **CommonLayout** | `mocho-ui/src/components/layout/CommonLayout` | Fallback layout | Basic layout for common pages |
| **LandingPageLayout** | `mocho-ui/src/components/layout/LandingPageLayout` | Hero + content layout | Landing page layout structure |
| **ProfileSetupLayout** | `mocho-ui/src/components/layout/ProfileSetupLayout` | Onboarding layout | User setup/onboarding flow layout |
| **ActionsCell** | `mocho-ui/src/components/DataGrid` | `function createActionsCell(config: ActionsCellConfig): GridColDef` | Data grid action buttons column factory |

---

## Exported Hooks

| Hook | Path | Signature | Purpose |
|------|------|-----------|---------|
| **useLocalStorage** | `mocho-ui/src/hooks/useLocalStorage` | `export default function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void]` | Persist state to browser localStorage with type safety |
| **useAutoFocus** | `mocho-ui/src/hooks/useAutoFocus` | `export function useAutoFocus(options?: UseAutoFocusOptions): RefObject<HTMLInputElement>` | Auto-focus input ref on mount |
| **useAutoFocusFirst** | `mocho-ui/src/hooks/useAutoFocus` | Variant of useAutoFocus | Auto-focus first input in container |
| **usePagination** | `mocho-ui/src/hooks/usePagination` | Pagination state management | Handles page, size, offset calculations |
| **useScriptRef** | `mocho-ui/src/hooks/useScriptRef` | Script ref manager | Safely reference DOM nodes |
| **useDocumentUpload** | `mocho-ui/src/hooks/useDocumentUpload` | `export function useDocumentUpload(options: UseDocumentUploadOptions): UseDocumentUploadReturn` | S3 presigned URL file upload with progress and processing polling |
| **useConfig** | `mocho-ui/src/hooks/useConfig` | Context hook for config | Access app configuration context |
| **useFormRef** | `mocho-ui/src/forms/hooks` | `export type UseFormRefReturn { ... }` | Formik form ref management |
| **useDirtyFormBlocker** | `mocho-ui/src/forms/hooks` | Blocks navigation on unsaved changes | Warn on unsaved form changes |

---

## Redux Utilities

| Utility | Path | Signature | Purpose |
|---------|------|-----------|---------|
| **createEntityModule** | `mocho-ui/src/redux/createEntityModule` | `export function createEntityModule<T>(...): EntityModule<T>` | Factory to create Redux module (slice + sagas) for entity CRUD |
| **createCrudSlice** | `mocho-ui/src/redux/createCrudSlice` | `export function createCrudSlice<TState>(...): Slice<TState>` | Redux Toolkit slice for standard CRUD operations with loading/error states |
| **createCrudSelectors** | `mocho-ui/src/redux/createCrudSlice` | Generates selector functions | Auto-generated selectors: getAll, getById, getLoading, getError |
| **getCrudActionNames** | `mocho-ui/src/redux/createCrudSlice` | Gets action type names | Returns CRUD action type strings |
| **createCrudSagas** | `mocho-ui/src/redux/createCrudSagas` | Factory for Redux-Saga workers | Generates sagas: fetchAll, fetchById, create, update, delete, updateMany, deleteMany |
| **LoadingState** | `mocho-ui/src/redux/types/loadingState` | Enum for loading states | 'idle' \| 'pending' \| 'fulfilled' \| 'rejected' |

**CRUD Slice Types:**
- `CrudPageState` - State shape with query, errors (keyed by operation:id), loading (keyed by operation:id)
- `CrudOperation` - 'getAll' \| 'getById' \| 'create' \| 'update' \| 'delete'
- `CrudSliceConfig<T>` - Configuration for createCrudSlice with entity type, initial state, reducers
- `FetchAllRequestPayload`, `FetchByIdRequestPayload`, `CreateRequestPayload<T>`, `UpdateRequestPayload<T>`, `DeleteRequestPayload` - Action payload types

---

## Form Types & Exports

| Type | Path | Definition | Purpose |
|------|------|-----------|---------|
| **FormStructure** | `mocho-ui/src/components/DynamicForm/types` | `{ fields?: FieldConfig[]; sections?: FieldSection[] }` | Form layout structure: flat fields or grouped sections |
| **FieldConfig** | `mocho-ui/src/components/DynamicForm/types` | Discriminated union of InputFieldConfig \| SelectFieldConfig \| TextareaFieldConfig \| SlugFieldConfig \| CharCounterFieldConfig | Type-safe field configuration |
| **FieldSection** | `mocho-ui/src/components/DynamicForm/types` | `{ title: string; fields: FieldConfig[]; collapsible?: boolean; defaultExpanded?: boolean }` | Grouped field section for Accordion layout |
| **FormHandle** | `mocho-ui/src/forms/types` | Formik form instance ref | Access form methods (submit, reset) |
| **FormState** | `mocho-ui/src/forms/types` | Form state snapshot | values, touched, errors, isSubmitting, isValidating |
| **FormikFieldProps** | `mocho-ui/src/components/form-fields/types` | Base Formik field props | Field props from Formik Formik.useFormik() |
| **BaseFieldWrapperProps** | `mocho-ui/src/components/form-fields/types` | Wrapper styling props | sx, className, container props |
| **EmailFieldProps** | `mocho-ui/src/components/form-fields/types` | Email input config | type, label, required, validation |
| **PasswordFieldProps** | `mocho-ui/src/components/form-fields/types` | Password input config | strength indicator, visibility toggle |
| **OTPFieldProps** | `mocho-ui/src/components/form-fields/types` | OTP input config | Length, verification callback |
| **SelectFieldProps** | `mocho-ui/src/components/form-fields/types` | Select dropdown config | options: SelectOption[] |
| **SelectOption** | `mocho-ui/src/components/form-fields/types` | `{ label: string; value: string \| number }` | Dropdown option |

---

## Theme System

| Export | Path | Details |
|--------|------|---------|
| **ThemeCustomization** | `mocho-ui/src/theme` | MUI Theme object; supports light/dark modes |
| **Palette Presets** | `mocho-ui/src/theme/palette` | Color system with semantic colors (primary, secondary, success, warning, error, info) |
| **Theme Variants** | `mocho-ui/src/theme/theme` | 8 preset themes (Default, Theme1-8) callable with palette + mode |
| **Component Overrides** | `mocho-ui/src/theme/overrides` | MUI component style overrides for 40+ components (Button, Card, Dialog, Table, etc.) |
| **Typography** | `mocho-ui/src/theme/typography` | Font families, sizes, weights |
| **PresetColor** | Type | 'theme1' \| 'theme2' \| 'theme3' \| 'theme4' \| 'theme5' \| 'theme6' \| 'theme7' \| 'theme8' |
| **ThemeMode** | Type | 'light' \| 'dark' |

---

## Layout Context

| Export | Path | Purpose |
|--------|------|---------|
| **LayoutProvider** | `mocho-ui/src/components/layout/LayoutContext` | Context provider for layout state (drawer open, menu config) |
| **useLayout** | `mocho-ui/src/components/layout/LayoutContext` | Hook: access layout context value |
| **useMenu** | `mocho-ui/src/components/layout/LayoutContext` | Hook: access menu state from context |
| **useLayoutConfig** | `mocho-ui/src/components/layout/LayoutContext` | Hook: access layout configuration |

---

## Utility Functions

| Function | Path | Signature | Purpose |
|----------|------|-----------|---------|
| **generateSlug** | `mocho-ui/src/utils/slugify` | `(text: string) => string` | Generate URL-friendly slug from text |
| **getImageUrl** | `mocho-ui/src/utils/getImageUrl` | `(path: string, imageType?: string) => string` | Resolve image CDN URL |
| **replaceImageUrls** | `mocho-ui/src/utils/replaceImageUrls` | HTML content with image replacements | Replace image placeholders with URLs |
| **getColors** | `mocho-ui/src/utils/getColors` | Color utility from theme | Get theme color value |
| **getShadow** | `mocho-ui/src/utils/getShadow` | `(shadow: number) => string` | Get MUI shadow CSS |
| **strengthColor** | `mocho-ui/src/utils/password-strength` | `(score: 0-100) => 'error' \| 'warning' \| 'success'` | Password strength color |
| **strengthIndicator** | `mocho-ui/src/utils/password-strength` | `(password: string) => number` | Calculate password strength score (0-100) |
| **obfuscateEmail** | `mocho-ui/src/utils/obfuscateEmail` | `(email: string) => string` | Hide email (e.g., j***@example.com) |
| **createMarkup** | `mocho-ui/src/utils/createMarkup` | `(html: string) => { __html: string }` | Safely create HTML from string for dangerouslySetInnerHTML |
| **formatLocation** | `mocho-ui/src/utils/formatLocation` | Format address components | City, State, ZIP display |
| **formatSetAside** | `mocho-ui/src/utils/formatSetAside` | Format SBA set-aside codes | Decode set-aside abbreviations |
| **extractUniqueNaicsInfo** | `mocho-ui/src/utils/extractUniqueNaicsInfo` | Extract unique NAICS codes | NAICS classification parsing |
| **validateEmail** | `mocho-ui/src/utils/validators` | `(email: string) => boolean` | Email format validation |
| **validatePassword** | `mocho-ui/src/utils/validators` | `(password: string) => { isValid: boolean; errors: string[] }` | Password policy validation |

---

## Types Exported

| Type | Path | Definition |
|------|------|-----------|
| **KeyedObject** | `mocho-ui/src/types/root` | `Record<string, any>` |
| **GenericCardProps** | `mocho-ui/src/types/root` | Card container props |
| **RootStateProps** | `mocho-ui/src/types/root` | Redux root state shape |
| **UserProfile** | `mocho-ui/src/types/auth` | User object shape |
| **Token** | `mocho-ui/src/types/auth` | Auth token structure |
| **JWTDataProps** | `mocho-ui/src/types/auth` | JWT payload shape |
| **CDWConfig** | `mocho-ui/src/types/auth` | CDW/SAM authentication config |
| **Platform** | `mocho-ui/src/types/auth` | 'web' \| 'mobile' enum |
| **GuardProps** | `mocho-ui/src/types/auth` | Route guard configuration |
| **Tenant** | `mocho-ui/src/types/tenant` | Tenant/organization record |
| **Membership** | `mocho-ui/src/types/membership` | User-to-tenant relationship |
| **NavItemType** | `mocho-ui/src/types/menu` | Navigation item config (label, path, icon, children) |
| **MenuProps** | `mocho-ui/src/types/menu` | Menu container props |
| **ButtonVariantProps** | `mocho-ui/src/types/extended` | Button style variants |
| **IconButtonShapeProps** | `mocho-ui/src/types/extended` | Icon button shape ('round', 'square') |
| **ColorProps** | `mocho-ui/src/types/extended` | Color variant type |
| **AvatarTypeProps** | `mocho-ui/src/types/extended` | Avatar rendering type (initials, image) |
| **SizeProps** | `mocho-ui/src/types/extended` | Size variants ('sm', 'md', 'lg') |

---

## Data Grid Integration

| Export | Path | Details |
|--------|------|---------|
| **ActionsCell** | Component | Pre-built data grid action cell (View, Edit, Delete buttons) |
| **createActionsCell** | Factory | `createActionsCell(config: ActionsCellConfig): GridColDef` - Creates ag-Grid column def for actions |
| **createStandardCrudActionsConfig** | Factory | `createStandardCrudActionsConfig(input: CreateStandardCrudActionsConfigInput): ActionsCellConfig` - Standard CRUD actions config |
| **ActionsCellConfig** | Type | Action definitions with view/edit/delete handlers |
| **ActionsCellProps** | Type | Row data, actions, disabled state |

---

## Store Configuration

| Export | Path | Purpose |
|--------|------|---------|
| **configureStore** | `mocho-ui/src/store` | Redux store setup with middleware |
| **Menu Reducer** | `mocho-ui/src/store/reducers/menu` | Menu open/close state |
| **UI Reducer** | `mocho-ui/src/store/reducers/ui` | Global UI state (theme, layout) |

---

## Entry Points & Package Exports

Subpath exports for tree-shaking:

| Subpath | Exports |
|---------|---------|
| `@mocho/ui` | All exports (convenience) |
| `@mocho/ui/redux` | Redux utilities, createCrudSlice, createCrudSagas, LoadingState |
| `@mocho/ui/forms` | Form hooks, form types, field types |
| `@mocho/ui/components` | All React components |
| `@mocho/ui/theme` | Theme, palette, typography, overrides |
| `@mocho/ui/hooks` | Custom hooks (useLocalStorage, usePagination, etc.) |
| `@mocho/ui/utils` | Utility functions (slugify, validators, formatters, etc.) |
| `@mocho/ui/types` | Type exports (auth, tenant, menu, etc.) |

---

## Representative Patterns

### 1. Type-Safe Dynamic Form with Discriminated Unions

```typescript
// Source: mocho-ui/src/components/DynamicForm/index.tsx (lines 30-165)
function getFormInput<TFormValues extends Record<string, any>>({
	field,
	values,
	setFieldValue,
	touched,
	errors,
	handleChange,
	handleBlur,
}: FormInputProps<TFormValues>): JSX.Element {
	const fieldValue = getFieldValue(values, field.name) ?? '';
	const isTouched = getFieldValue(touched, field.name);
	const errorMessage = getFieldValue(errors, field.name);
	const hasError = Boolean(isTouched && errorMessage);

	// Type-safe switch using discriminated union
	switch (field.type) {
		case 'input': {
			// TypeScript now knows this is InputFieldConfig
			const inputType = field.inputType || 'text';
			return <OutlinedInput {...props} />;
		}
		case 'select': {
			return <Select {...props} />;
		}
		default: {
			// Exhaustive check - TypeScript will error if we miss a case
			const _exhaustiveCheck: never = field;
			return _exhaustiveCheck;
		}
	}
}
```

**Pattern:** Discriminated union types ensure all field types are handled without type assertions or missing cases.

---

### 2. Custom Hook with State Management and Cleanup

```typescript
// Source: mocho-ui/src/hooks/useDocumentUpload.ts (lines 80-120)
export function useDocumentUpload(options: UseDocumentUploadOptions): UseDocumentUploadReturn {
	const [state, setState] = useState<UploadState>('idle');
	const [progress, setProgress] = useState(0);
	const abortControllerRef = useRef<AbortController | null>(null);
	const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	const clearPolling = useCallback(() => {
		if (pollingTimeoutRef.current) {
			clearTimeout(pollingTimeoutRef.current);
			pollingTimeoutRef.current = null;
		}
	}, []);

	const reset = useCallback(() => {
		clearPolling();
		abortControllerRef.current?.abort();
		setState('idle');
		setProgress(0);
	}, [clearPolling]);

	return {
		state,
		progress,
		upload,
		cancel,
		reset,
	};
}
```

**Pattern:** Refs for side effects, useCallback for dependency stability, cleanup in reset function.

---

### 3. Redux Slice with Entity-Level Loading State

```typescript
// Source: mocho-ui/src/redux/createCrudSlice/index.ts (lines 75-90)
export interface CrudPageState {
	query: string;
	// Keyed by operation or operation:entityId
	// Examples: 'getAll', 'getById:123', 'update:456'
	errors: Record<string, string>;
	loading: Record<string, string>;
}

export type CrudOperation = 'getAll' | 'getById' | 'create' | 'update' | 'delete';
```

**Pattern:** Composite keys (operation:id) enable tracking loading/errors per entity while supporting operation-level tracking.

---

### 4. Styled Component Wrapper with Defaults

```typescript
// Source: mocho-ui/src/components/PageHeader/index.tsx (lines 13-55)
export const PageHeader: React.FC<PageHeaderProps> = ({
	showBackButton = false,
	onNavigate,
	title,
	subtitle,
	headerActions,
}) => {
	return (
		<Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
			<Box display="flex" alignItems="center" gap={2}>
				{showBackButton && onNavigate && (
					<IconButton size="large" edge="start" color="inherit" onClick={onNavigate}>
						<ArrowBackIcon />
					</IconButton>
				)}
				<Box>
					{title && <Typography variant="h3" component="h1">{title}</Typography>}
					{subtitle && <Typography variant="subtitle1" color="text.secondary">{subtitle}</Typography>}
				</Box>
			</Box>
			<Box>{headerActions && <Box>{headerActions}</Box>}</Box>
		</Stack>
	);
};
```

**Pattern:** MUI Stack/Box composition, conditional rendering with &&, semantic HTML (h1), prop defaults.

---

### 5. Test Pattern with Theme Provider

```typescript
// Source: mocho-ui/src/components/PageHeader/PageHeader.test.tsx (lines 1-40)
const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) => {
	return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe('PageHeader', () => {
	describe('rendering', () => {
		it('renders title', () => {
			renderWithTheme(<PageHeader title="Dashboard" />);
			expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
		});

		it('renders title as h1', () => {
			renderWithTheme(<PageHeader title="Dashboard" />);
			const heading = screen.getByRole('heading', { level: 1 });
			expect(heading).toHaveTextContent('Dashboard');
		});
	});
});
```

**Pattern:** Custom render helper for theme, semantic queries (getByRole), describe blocks organize tests by behavior.
