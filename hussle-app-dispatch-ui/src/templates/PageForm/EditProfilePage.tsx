import { useFormRef } from 'hooks/useFormRef';
import { useDirtyFormBlocker } from 'hooks/useDirtyFormBlocker';
import ProfileEditForm from 'components/forms/ProfileEditForm';

export default function EditProfilePage() {
  const { formRef, formState, handleFormStateChange, submitForm } = useFormRef();
  const { data: profile, isLoading } = useGetProfileQuery(profileId);
  const dispatch = useDispatch();

  const isSaveDisabled = formState.isSubmitting || !formState.isDirty;

  // Only edit pages block navigation
  useDirtyFormBlocker({
    isDirty: formState.isDirty,
    isSubmitting: formState.isSubmitting,
    onBlock: (blocker) => dispatch(openModal({
      modalType: 'dirtyFormConfirm',
      modalProps: { blocker },
    })),
  });

  const handleSubmit = async (values) => {
    await api.updateProfile({ id: profileId, ...values });
  };

  if (isLoading) return <PageSkeleton />;

  return (
    <PageWrapper>
      <PageHeader
        title="Edit Profile"
        actions={
          <Button onClick={submitForm} disabled={isSaveDisabled}>
            {formState.isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        }
      />
      <ProfileEditForm
        ref={formRef}
        initialValues={profile}
        onSubmit={handleSubmit}
        onStateChange={handleFormStateChange}
      />
    </PageWrapper>
  );
}
// ```

// ---

// ## The complete flow at a glance
// ```
// CREATE PAGE
//   useFormRef → formRef, formState, submitForm
//   <ProfileCreateForm ref={formRef} onStateChange={handleFormStateChange} />
//     └── useFormik        (form engine)
//     └── useFormHandle    (wires formik → ref, pushes state up)

// EDIT PAGE
//   useFormRef           → formRef, formState, submitForm
//   useDirtyFormBlocker  → blocks navigation when isDirty
//   <ProfileEditForm ref={formRef} onStateChange={handleFormStateChange} />
//     └── useFormik                  (form engine)
//     └── useUserInteractionDirty   (prevents false dirty on load)
//     └── useFormHandle              (wires formik → ref, pushes state up)

//     ```