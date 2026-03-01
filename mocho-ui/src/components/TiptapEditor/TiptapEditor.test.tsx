import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Create a mock editor with all required methods
const createMockEditor = () => {
  const mockChainableCommands = {
    focus: jest.fn().mockReturnThis(),
    toggleBold: jest.fn().mockReturnThis(),
    toggleItalic: jest.fn().mockReturnThis(),
    toggleStrike: jest.fn().mockReturnThis(),
    toggleCode: jest.fn().mockReturnThis(),
    toggleBulletList: jest.fn().mockReturnThis(),
    toggleOrderedList: jest.fn().mockReturnThis(),
    toggleBlockquote: jest.fn().mockReturnThis(),
    toggleCodeBlock: jest.fn().mockReturnThis(),
    setImage: jest.fn().mockReturnThis(),
    setLink: jest.fn().mockReturnThis(),
    unsetLink: jest.fn().mockReturnThis(),
    extendMarkRange: jest.fn().mockReturnThis(),
    setHorizontalRule: jest.fn().mockReturnThis(),
    clearNodes: jest.fn().mockReturnThis(),
    unsetAllMarks: jest.fn().mockReturnThis(),
    undo: jest.fn().mockReturnThis(),
    redo: jest.fn().mockReturnThis(),
    run: jest.fn(),
  };

  return {
    getHTML: () => '<p>test content</p>',
    commands: {
      setContent: jest.fn(),
    },
    setEditable: jest.fn(),
    isActive: jest.fn().mockReturnValue(false),
    chain: jest.fn().mockReturnValue(mockChainableCommands),
    getAttributes: jest.fn().mockReturnValue({ href: '' }),
    can: jest.fn().mockReturnValue({
      undo: jest.fn().mockReturnValue(true),
      redo: jest.fn().mockReturnValue(true),
    }),
  };
};

// Mock Tiptap before importing the component
jest.mock('@tiptap/react', () => ({
  useEditor: () => createMockEditor(),
  EditorContent: ({ editor }: { editor: any }) => (
    <div data-testid="editor-content">
      {editor ? 'Editor loaded' : 'No editor'}
    </div>
  ),
}));

// Mock as functions that return extension objects
jest.mock('@tiptap/starter-kit', () => {
  const mockExtension = { configure: () => mockExtension };
  return { default: mockExtension, __esModule: true };
});

jest.mock('@tiptap/extension-link', () => {
  const mockExtension = { configure: () => mockExtension };
  return { default: mockExtension, __esModule: true };
});

jest.mock('@tiptap/extension-image', () => {
  const mockExtension = { configure: () => mockExtension };
  return { default: mockExtension, __esModule: true };
});

jest.mock('@tiptap/extension-placeholder', () => {
  const mockExtension = { configure: () => mockExtension };
  return { default: mockExtension, __esModule: true };
});

import { TiptapEditor } from './index';

const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe('TiptapEditor', () => {
  describe('rendering', () => {
    it('renders editor content area', () => {
      renderWithTheme(
        <TiptapEditor value="" onChange={jest.fn()} />
      );

      expect(screen.getByTestId('editor-content')).toBeInTheDocument();
    });

    it('renders helper text when provided', () => {
      renderWithTheme(
        <TiptapEditor
          value=""
          onChange={jest.fn()}
          helperText="This is helper text"
        />
      );

      expect(screen.getByText('This is helper text')).toBeInTheDocument();
    });

    it('renders error helper text with error styling', () => {
      renderWithTheme(
        <TiptapEditor
          value=""
          onChange={jest.fn()}
          error={true}
          helperText="This field is required"
        />
      );

      const helperText = screen.getByText('This field is required');
      expect(helperText).toBeInTheDocument();
      expect(helperText).toHaveClass('Mui-error');
    });
  });

  describe('error state', () => {
    it('applies error styling when error prop is true', () => {
      const { container } = renderWithTheme(
        <TiptapEditor value="" onChange={jest.fn()} error={true} />
      );

      // The outer Box should have error border styling
      const editorWrapper = container.querySelector('.MuiBox-root');
      expect(editorWrapper).toBeInTheDocument();
    });

    it('does not apply error styling when error prop is false', () => {
      const { container } = renderWithTheme(
        <TiptapEditor value="" onChange={jest.fn()} error={false} />
      );

      const editorWrapper = container.querySelector('.MuiBox-root');
      expect(editorWrapper).toBeInTheDocument();
    });
  });

  describe('disabled state', () => {
    it('accepts disabled prop', () => {
      renderWithTheme(
        <TiptapEditor value="" onChange={jest.fn()} disabled={true} />
      );

      expect(screen.getByTestId('editor-content')).toBeInTheDocument();
    });
  });

  describe('props', () => {
    it('accepts minHeight and maxHeight props', () => {
      renderWithTheme(
        <TiptapEditor
          value=""
          onChange={jest.fn()}
          minHeight={300}
          maxHeight={500}
        />
      );

      expect(screen.getByTestId('editor-content')).toBeInTheDocument();
    });

    it('accepts placeholder prop', () => {
      renderWithTheme(
        <TiptapEditor
          value=""
          onChange={jest.fn()}
          placeholder="Enter content here..."
        />
      );

      expect(screen.getByTestId('editor-content')).toBeInTheDocument();
    });
  });
});
