# PRD: Storybook Stories for @mocho/ui Component Library

**Version:** 1.0
**Date:** January 2026
**Status:** Ready for Implementation
**Owner:** Frontend Team

---

## 1. Overview

### 1.1 Purpose
Create comprehensive Storybook stories for all components in the @mocho/ui shared component library to provide interactive documentation, visual testing capabilities, and a development playground.

### 1.2 Background
The @mocho/ui library contains 50+ reusable React components but currently only has 4 Storybook stories. This creates challenges for:
- Developers discovering and understanding available components
- QA testing component behavior in isolation
- Designers reviewing component implementations
- Onboarding new team members

### 1.3 Goals
1. **Documentation** - Every component has interactive documentation with prop controls
2. **Discoverability** - Organized sidebar navigation by component category
3. **Testing** - Visual regression testing foundation
4. **Development** - Isolated development environment for components

### 1.4 Success Metrics
- 100% of components have at least one story
- Each story has working controls for all major props
- Zero console errors when running Storybook
- All stories render correctly in light/dark themes

---

## 2. Current State

### 2.1 Existing Stories (4)
| Component | Location | Status |
|-----------|----------|--------|
| MainCard | `MainCard/MainCard.stories.tsx` | Complete |
| EmptyState | `EmptyState/EmptyState.stories.tsx` | Complete |
| PageLoader | `PageLoader/PageLoader.stories.tsx` | Complete |
| AnimateButton | `extended/AnimateButton/AnimateButton.stories.tsx` | Complete |

### 2.2 Storybook Configuration
- **Framework:** `@storybook/react-vite`
- **Addons:** links, essentials, interactions, themes
- **Theme:** Wrapped with MUI ThemeCustomization
- **Path Aliases:** Configured for `@/components`, `@/hooks`, etc.

### 2.3 Story Pattern
```typescript
import type { Meta, StoryObj } from '@storybook/react';
import ComponentName from './index';

const meta: Meta<typeof ComponentName> = {
  title: 'Components/Category/ComponentName',
  component: ComponentName,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: { /* prop controls */ },
};

export default meta;
type Story = StoryObj<typeof ComponentName>;

export const Default: Story = { args: { /* props */ } };
```

---

## 3. Requirements

### 3.1 Functional Requirements

#### FR-1: Story Coverage
- Every exportable component MUST have at least one story
- Stories MUST demonstrate the component's primary use case
- Stories SHOULD include common variants (2-5 per component)

#### FR-2: Interactive Controls
- All public props MUST have argTypes defined
- Boolean props MUST use checkbox controls
- String props with limited values MUST use select controls
- Number props MUST have appropriate min/max ranges

#### FR-3: Documentation
- Each story file MUST have a JSDoc comment describing the component
- Each story variant MUST have a description comment
- Complex components SHOULD have usage examples in MDX

#### FR-4: Organization
- Stories MUST be organized by category in the sidebar
- Categories: Extended, Form Fields, Feedback, Data Display, Layout, Complex, Layouts

#### FR-5: Theme Support
- All stories MUST render correctly in light theme
- All stories SHOULD render correctly in dark theme (via theme toggle)

### 3.2 Non-Functional Requirements

#### NFR-1: Performance
- Storybook MUST load within 10 seconds
- Individual stories MUST render within 2 seconds

#### NFR-2: Accessibility
- Stories demonstrating accessibility features SHOULD be included where applicable
- Form field stories MUST show proper label associations

#### NFR-3: Maintainability
- Stories MUST be colocated with components (same directory)
- Stories MUST use the component's TypeScript types

---

## 4. Component Inventory

### 4.1 Extended Components (8 total, 1 done)

| Component | Priority | Complexity | Notes |
|-----------|----------|------------|-------|
| AnimateButton | - | - | ✅ Complete |
| Avatar | High | Low | Show sizes, colors, fallback |
| Breadcrumbs | High | Medium | Navigation paths, custom separators |
| Dot | Low | Low | Color variants, sizes |
| IconButton | High | Low | Sizes, colors, disabled states |
| LoadingButton | High | Medium | Loading states, variants |
| Snackbar | Medium | Medium | Alert types, positions |
| Tooltip | Medium | Low | Placements, custom content |
| Transitions | Medium | Medium | Transition types, durations |

### 4.2 Form Fields (22 total)

| Component | Priority | Complexity | Notes |
|-----------|----------|------------|-------|
| TextField | High | Low | Standard input variants |
| EmailField | High | Low | Email validation display |
| PasswordField | High | Medium | Show/hide toggle |
| PasswordFieldWithStrength | High | High | Strength meter, requirements |
| PasswordFieldWithChecklist | Medium | High | Checklist validation display |
| ConfirmPasswordField | Medium | Medium | Match validation |
| SelectField | High | Medium | Single select, options |
| MultiSelectChipField | High | High | Multi-select with chips |
| CheckboxField | High | Low | Checked states, labels |
| DateTimePickerField | High | High | Date/time selection |
| CharCounterField | Medium | Low | Character limit display |
| OTPField | Medium | High | OTP input boxes |
| ImageUploadField | High | High | Upload, preview, validation |
| DeferredImageUploadField | Medium | High | Deferred upload pattern |
| DocumentImageUploadField | Medium | High | Document-specific upload |
| RichTextEditorField | High | High | Tiptap integration |
| SubmitButton | High | Low | Loading, disabled states |
| SecondaryButton | Medium | Low | Secondary action styling |
| BaseFieldWrapper | Low | Low | Field wrapper pattern |
| FormError | Medium | Low | Error message display |
| FormLink | Low | Low | Form navigation links |
| HelperText | Low | Low | Helper text variants |
| TermsNotice | Low | Low | Terms checkbox pattern |

### 4.3 Dialogs & Feedback (6 total, 2 done)

| Component | Priority | Complexity | Notes |
|-----------|----------|------------|-------|
| EmptyState | - | - | ✅ Complete |
| PageLoader | - | - | ✅ Complete |
| ConfirmDialog | High | Medium | Confirm/cancel actions |
| ConfirmDeleteDialog | High | Medium | Delete confirmation |
| FormDialog | High | High | Form in dialog pattern |
| ErrorState | Medium | Low | Error display variants |
| ErrorBoundary | Low | Medium | Error catching demo |
| ErrorPage | Low | Low | Full page error |

### 4.4 Data Display (5 total)

| Component | Priority | Complexity | Notes |
|-----------|----------|------------|-------|
| DataGrid | High | High | AG Grid wrapper, actions |
| NewDataGrid | High | High | Updated grid component |
| Tabs | High | Medium | Tab navigation |
| SkeletonLoader | Medium | Low | Loading skeletons |
| DebouncedInput | Low | Low | Debounced search |

### 4.5 Layout Components (6 total, 1 done)

| Component | Priority | Complexity | Notes |
|-----------|----------|------------|-------|
| MainCard | - | - | ✅ Complete |
| Logo | High | Low | Logo variants |
| PageWrapper | High | Medium | Page container |
| PageHeader | High | Medium | Page headers |
| EditableSection | Medium | Medium | Edit mode toggle |
| ScrollX | Low | Low | Horizontal scroll |
| Loadable | Low | Low | Lazy loading wrapper |

### 4.6 Complex Components (6 total)

| Component | Priority | Complexity | Notes |
|-----------|----------|------------|-------|
| TiptapEditor | High | High | Rich text editor |
| DynamicForm | High | High | Dynamic form generation |
| StepperForm | High | High | Multi-step forms |
| ImageRadioGroup | Medium | Medium | Image selection |
| StatisticsCard | Medium | Medium | Stats display |
| CardSkeleton | Low | Low | Card loading state |

### 4.7 Full Layouts (4 total)

| Component | Priority | Complexity | Notes |
|-----------|----------|------------|-------|
| MainLayout | High | High | Admin dashboard layout |
| CommonLayout | Medium | Medium | Common page layout |
| LandingPageLayout | Medium | High | Marketing page layout |
| ProfileSetupLayout | Low | Medium | Onboarding layout |

---

## 5. Implementation Plan

### 5.1 Phase 1: Extended Components (Week 1)
**Scope:** 7 remaining extended components
**Effort:** 1-2 days

Stories to create:
1. Avatar.stories.tsx
2. Breadcrumbs.stories.tsx
3. Dot.stories.tsx
4. IconButton.stories.tsx
5. LoadingButton.stories.tsx
6. Snackbar.stories.tsx
7. Tooltip.stories.tsx
8. Transitions.stories.tsx

### 5.2 Phase 2: Form Fields - High Priority (Week 1-2)
**Scope:** 11 high-priority form fields
**Effort:** 3-4 days

Stories to create:
1. TextField.stories.tsx
2. EmailField.stories.tsx
3. PasswordField.stories.tsx
4. PasswordFieldWithStrength.stories.tsx
5. SelectField.stories.tsx
6. MultiSelectChipField.stories.tsx
7. CheckboxField.stories.tsx
8. DateTimePickerField.stories.tsx
9. ImageUploadField.stories.tsx
10. RichTextEditorField.stories.tsx
11. SubmitButton.stories.tsx

### 5.3 Phase 3: Dialogs & Data Display (Week 2)
**Scope:** 7 components
**Effort:** 2-3 days

Stories to create:
1. ConfirmDialog.stories.tsx
2. ConfirmDeleteDialog.stories.tsx
3. FormDialog.stories.tsx
4. ErrorState.stories.tsx
5. DataGrid.stories.tsx
6. NewDataGrid.stories.tsx
7. Tabs.stories.tsx

### 5.4 Phase 4: Layout & Complex Components (Week 2-3)
**Scope:** 9 components
**Effort:** 3-4 days

Stories to create:
1. Logo.stories.tsx
2. PageWrapper.stories.tsx
3. PageHeader.stories.tsx
4. EditableSection.stories.tsx
5. TiptapEditor.stories.tsx
6. DynamicForm.stories.tsx
7. StepperForm.stories.tsx
8. ImageRadioGroup.stories.tsx
9. StatisticsCard.stories.tsx

### 5.5 Phase 5: Form Fields - Medium/Low Priority (Week 3)
**Scope:** 11 remaining form fields
**Effort:** 2-3 days

Stories to create:
1. PasswordFieldWithChecklist.stories.tsx
2. ConfirmPasswordField.stories.tsx
3. CharCounterField.stories.tsx
4. OTPField.stories.tsx
5. DeferredImageUploadField.stories.tsx
6. DocumentImageUploadField.stories.tsx
7. SecondaryButton.stories.tsx
8. FormError.stories.tsx
9. BaseFieldWrapper.stories.tsx
10. FormLink.stories.tsx
11. HelperText.stories.tsx
12. TermsNotice.stories.tsx

### 5.6 Phase 6: Full Layouts & Remaining (Week 3-4)
**Scope:** 10 remaining components
**Effort:** 3-4 days

Stories to create:
1. MainLayout.stories.tsx (requires router mock)
2. CommonLayout.stories.tsx
3. LandingPageLayout.stories.tsx
4. ProfileSetupLayout.stories.tsx
5. SkeletonLoader.stories.tsx
6. DebouncedInput.stories.tsx
7. ScrollX.stories.tsx
8. Loadable.stories.tsx
9. ErrorBoundary.stories.tsx
10. ErrorPage.stories.tsx
11. CardSkeleton.stories.tsx

---

## 6. Technical Specifications

### 6.1 File Naming Convention
```
ComponentName/
├── index.tsx           # Component implementation
├── ComponentName.stories.tsx  # Storybook stories
└── __tests__/          # Tests (if applicable)
```

### 6.2 Story Title Convention
```
Components/
├── Extended/ComponentName
├── Form Fields/ComponentName
├── Feedback/ComponentName
├── Data Display/ComponentName
├── Layout/ComponentName
├── Complex/ComponentName
└── Layouts/ComponentName
```

### 6.3 Required Story Variants

**Minimum per component:**
1. `Default` - Basic usage with minimal props
2. At least 2-3 additional variants showing:
   - Different states (loading, error, disabled)
   - Different sizes or visual variants
   - Edge cases (empty, overflow, long text)

**Form fields should include:**
- Default
- WithValue
- WithError
- Disabled
- WithHelperText

### 6.4 Decorators for Special Cases

**Form fields (Formik wrapper):**
```typescript
decorators: [
  (Story) => (
    <Formik initialValues={{}} onSubmit={() => {}}>
      <Form><Story /></Form>
    </Formik>
  ),
],
```

**Layout components (Router + LayoutProvider):**
```typescript
decorators: [
  (Story) => (
    <MemoryRouter>
      <LayoutProvider menuItems={mockMenuItems} user={mockUser}>
        <Story />
      </LayoutProvider>
    </MemoryRouter>
  ),
],
```

### 6.5 Mock Data Location
Create shared mock data in:
```
src/
└── __mocks__/
    └── storybook/
        ├── menuItems.ts
        ├── user.ts
        ├── tableData.ts
        └── formOptions.ts
```

---

## 7. Quality Checklist

### 7.1 Per-Story Checklist
- [ ] Story renders without console errors
- [ ] All props have argTypes defined
- [ ] Controls work as expected
- [ ] Story has descriptive JSDoc comment
- [ ] Component renders correctly at different viewport sizes
- [ ] Accessibility: keyboard navigation works (where applicable)

### 7.2 Per-Phase Checklist
- [ ] All stories in phase are complete
- [ ] Stories are organized in correct category
- [ ] `npm run dev` (Storybook) runs without errors
- [ ] All new stories appear in sidebar
- [ ] Dark theme toggle works for all stories

### 7.3 Final Checklist
- [ ] 100% component coverage
- [ ] No TypeScript errors
- [ ] No ESLint warnings in story files
- [ ] Storybook builds successfully (`npm run build:storybook`)
- [ ] All autodocs generate correctly

---

## 8. Dependencies

### 8.1 Required Packages (Already Installed)
- @storybook/react-vite
- @storybook/addon-essentials
- @storybook/addon-interactions
- @storybook/addon-links
- @storybook/addon-themes

### 8.2 May Need to Add
- @storybook/addon-a11y (accessibility testing)
- storybook-react-router (for layout stories)

---

## 9. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Form fields require Formik context | Medium | Create reusable Formik decorator |
| Layout components need router | High | Use MemoryRouter in decorators |
| Some components have complex state | Medium | Use story args and actions |
| AG Grid license warning | Low | Ignore or mock for stories |

---

## 10. Appendix

### A. Story Template

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { ComponentName } from './index';

/**
 * ComponentName - Brief description of what the component does
 *
 * Use this component when you need to...
 */
const meta: Meta<typeof ComponentName> = {
  title: 'Components/Category/ComponentName',
  component: ComponentName,
  parameters: {
    layout: 'centered', // or 'padded' for larger components
  },
  tags: ['autodocs'],
  argTypes: {
    propName: {
      control: 'text', // or 'boolean', 'select', 'number'
      description: 'Description of what this prop does',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ComponentName>;

/**
 * Default state of the component
 */
export const Default: Story = {
  args: {
    // Default prop values
  },
};

/**
 * Component in loading state
 */
export const Loading: Story = {
  args: {
    loading: true,
  },
};

/**
 * Component with error
 */
export const WithError: Story = {
  args: {
    error: 'Something went wrong',
  },
};
```

### B. Commands Reference

```bash
# Start Storybook development server
npm run dev

# Build Storybook for deployment
npm run build:storybook

# Preview built Storybook
npm run preview:storybook
```
