import { useFormRef } from 'hooks/useFormRef';
import ProfileCreateForm from 'components/forms/ProfileCreateForm';

export default function CreateProfilePage() {
  const { formRef, formState, handleFormStateChange, submitForm } = useFormRef();

  const isSaveDisabled = formState.isSubmitting;

  const handleSubmit = async (values) => {
    await api.createProfile(values);
    navigate('/profiles');
  };

  return (
    <PageWrapper>
      <PageHeader
        title="Create Profile"
        actions={
          <Button onClick={submitForm} disabled={isSaveDisabled}>
            {formState.isSubmitting ? 'Creating...' : 'Create Profile'}
          </Button>
        }
      />
      <ProfileCreateForm
        ref={formRef}
        onSubmit={handleSubmit}
        onStateChange={handleFormStateChange}
      />
    </PageWrapper>
  );
}