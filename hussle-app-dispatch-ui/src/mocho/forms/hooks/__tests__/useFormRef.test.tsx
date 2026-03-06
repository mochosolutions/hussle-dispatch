import { renderHook, act } from '@testing-library/react';
import { useFormRef } from '../useFormRef';
import type { FormHandle, FormState } from '../../types/form';

describe('useFormRef', () => {
  describe('initial state', () => {
    it('returns initial form state with all false values', () => {
      const { result } = renderHook(() => useFormRef());

      expect(result.current.formState).toEqual({
        isSubmitting: false,
        isValid: false,
        isDirty: false,
      });
    });

    it('returns a formRef', () => {
      const { result } = renderHook(() => useFormRef());

      expect(result.current.formRef).toBeDefined();
      expect(result.current.formRef.current).toBeNull();
    });

    it('returns isSaveDisabled as true initially (form is invalid)', () => {
      const { result } = renderHook(() => useFormRef());

      expect(result.current.isSaveDisabled).toBe(true);
    });
  });

  describe('handleFormStateChange', () => {
    it('updates formState when called', () => {
      const { result } = renderHook(() => useFormRef());

      const newState: FormState = {
        isSubmitting: false,
        isValid: true,
        isDirty: true,
      };

      act(() => {
        result.current.handleFormStateChange(newState);
      });

      expect(result.current.formState).toEqual(newState);
    });

    it('callback reference is stable across renders', () => {
      const { result, rerender } = renderHook(() => useFormRef());

      const firstCallback = result.current.handleFormStateChange;

      rerender();

      expect(result.current.handleFormStateChange).toBe(firstCallback);
    });
  });

  describe('isSaveDisabled', () => {
    it('returns true when form is submitting', () => {
      const { result } = renderHook(() => useFormRef());

      act(() => {
        result.current.handleFormStateChange({
          isSubmitting: true,
          isValid: true,
          isDirty: true,
        });
      });

      expect(result.current.isSaveDisabled).toBe(true);
    });

    it('returns true when form is invalid', () => {
      const { result } = renderHook(() => useFormRef());

      act(() => {
        result.current.handleFormStateChange({
          isSubmitting: false,
          isValid: false,
          isDirty: true,
        });
      });

      expect(result.current.isSaveDisabled).toBe(true);
    });

    it('returns false when form is valid and not submitting', () => {
      const { result } = renderHook(() => useFormRef());

      act(() => {
        result.current.handleFormStateChange({
          isSubmitting: false,
          isValid: true,
          isDirty: true,
        });
      });

      expect(result.current.isSaveDisabled).toBe(false);
    });
  });

  describe('saveButtonText', () => {
    it('returns default text when not submitting', () => {
      const { result } = renderHook(() => useFormRef());

      act(() => {
        result.current.handleFormStateChange({
          isSubmitting: false,
          isValid: true,
          isDirty: false,
        });
      });

      expect(result.current.saveButtonText('Save')).toBe('Save');
    });

    it('returns submitting text when submitting', () => {
      const { result } = renderHook(() => useFormRef());

      act(() => {
        result.current.handleFormStateChange({
          isSubmitting: true,
          isValid: true,
          isDirty: false,
        });
      });

      expect(result.current.saveButtonText('Save')).toBe('Saving...');
    });

    it('uses custom submitting text when provided', () => {
      const { result } = renderHook(() => useFormRef());

      act(() => {
        result.current.handleFormStateChange({
          isSubmitting: true,
          isValid: true,
          isDirty: false,
        });
      });

      expect(result.current.saveButtonText('Create', 'Creating...')).toBe(
        'Creating...'
      );
    });
  });

  describe('submitForm', () => {
    it('calls submit on formRef.current when available', () => {
      const { result } = renderHook(() => useFormRef());

      const mockSubmit = jest.fn().mockResolvedValue(undefined);
      const mockFormHandle: FormHandle = {
        submit: mockSubmit,
        reset: jest.fn(),
        isSubmitting: false,
        isValid: true,
        isDirty: false,
      };

      // Simulate form mounting and setting ref
      Object.defineProperty(result.current.formRef, 'current', {
        value: mockFormHandle,
        writable: true,
      });

      act(() => {
        result.current.submitForm();
      });

      expect(mockSubmit).toHaveBeenCalledTimes(1);
    });

    it('does not throw when formRef.current is null', () => {
      const { result } = renderHook(() => useFormRef());

      expect(() => {
        act(() => {
          result.current.submitForm();
        });
      }).not.toThrow();
    });
  });

  describe('resetForm', () => {
    it('calls reset on formRef.current when available', () => {
      const { result } = renderHook(() => useFormRef());

      const mockReset = jest.fn();
      const mockFormHandle: FormHandle = {
        submit: jest.fn().mockResolvedValue(undefined),
        reset: mockReset,
        isSubmitting: false,
        isValid: true,
        isDirty: false,
      };

      // Simulate form mounting and setting ref
      Object.defineProperty(result.current.formRef, 'current', {
        value: mockFormHandle,
        writable: true,
      });

      act(() => {
        result.current.resetForm();
      });

      expect(mockReset).toHaveBeenCalledTimes(1);
    });

    it('does not throw when formRef.current is null', () => {
      const { result } = renderHook(() => useFormRef());

      expect(() => {
        act(() => {
          result.current.resetForm();
        });
      }).not.toThrow();
    });
  });

  describe('generic type parameter', () => {
    interface CustomFormHandle extends FormHandle {
      customMethod: () => void;
    }

    it('accepts custom form handle type', () => {
      const { result } = renderHook(() => useFormRef<CustomFormHandle>());

      // TypeScript should accept this - demonstrating type safety
      expect(result.current.formRef.current).toBeNull();
    });
  });
});
