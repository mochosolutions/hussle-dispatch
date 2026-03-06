import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Box, Paper, Typography, Button, Stack } from '@mui/material';
import { TiptapEditor } from './index';

/**
 * TiptapEditor is a rich text editor based on Tiptap/ProseMirror.
 *
 * Features:
 * - Text formatting (bold, italic, strikethrough, code)
 * - Lists (bullet, ordered)
 * - Block elements (blockquote, code block, horizontal rule)
 * - Headings (H1-H6)
 * - Links and images
 * - Undo/redo
 * - Placeholder text
 * - Error state styling
 */
const meta: Meta<typeof TiptapEditor> = {
  title: 'Components/Complex/TiptapEditor',
  component: TiptapEditor,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'text',
      description: 'HTML content value',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text when editor is empty',
    },
    minHeight: {
      control: { type: 'number', min: 100, max: 600 },
      description: 'Minimum editor height in pixels',
    },
    maxHeight: {
      control: { type: 'number', min: 200, max: 1000 },
      description: 'Maximum editor height in pixels',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the editor is disabled',
    },
    error: {
      control: 'boolean',
      description: 'Show error state styling',
    },
    helperText: {
      control: 'text',
      description: 'Helper or error text below editor',
    },
  },
};

export default meta;
type Story = StoryObj<typeof TiptapEditor>;

const ControlledEditor = () => {
  const [content, setContent] = useState('<p>Start editing here...</p>');

  return (
    <Box>
      <TiptapEditor value={content} onChange={setContent} />
      <Paper sx={{ mt: 2, p: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          HTML Output:
        </Typography>
        <Box
          component="pre"
          sx={{
            bgcolor: 'grey.100',
            p: 1,
            borderRadius: 1,
            fontSize: '0.75rem',
            overflow: 'auto',
            maxHeight: 200,
          }}
        >
          {content}
        </Box>
      </Paper>
    </Box>
  );
};

export const Default: Story = {
  render: () => <ControlledEditor />,
};

export const WithPlaceholder: Story = {
  args: {
    value: '',
    placeholder: 'Write your blog post content here...',
    onChange: () => {},
  },
};

export const WithContent: Story = {
  args: {
    value: `
      <h2>Welcome to the Editor</h2>
      <p>This is a <strong>rich text editor</strong> with many features:</p>
      <ul>
        <li>Bold, italic, and <s>strikethrough</s> text</li>
        <li><code>Inline code</code> formatting</li>
        <li>Links and images</li>
      </ul>
      <blockquote>
        <p>This is a blockquote that highlights important information.</p>
      </blockquote>
      <p>You can also add code blocks:</p>
      <pre><code>const greeting = 'Hello, World!';
console.log(greeting);</code></pre>
    `,
    onChange: () => {},
  },
};

export const CustomHeight: Story = {
  args: {
    value: '<p>This editor has custom min/max height settings.</p>',
    minHeight: 300,
    maxHeight: 400,
    onChange: () => {},
  },
};

export const Disabled: Story = {
  args: {
    value: '<p>This editor is <strong>disabled</strong> and cannot be edited.</p>',
    disabled: true,
    onChange: () => {},
  },
};

export const WithError: Story = {
  args: {
    value: '',
    error: true,
    helperText: 'Content is required',
    placeholder: 'Please enter some content...',
    onChange: () => {},
  },
};

export const WithHelperText: Story = {
  args: {
    value: '<p>Start typing your content...</p>',
    helperText: 'Use the toolbar to format your text',
    onChange: () => {},
  },
};

export const BlogPostEditor: Story = {
  name: 'Blog Post Editor Example',
  render: () => {
    const [content, setContent] = useState(`
      <h1>My First Blog Post</h1>
      <p>This is an example of how the editor might look when editing a blog post.</p>
      <h2>Introduction</h2>
      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
      <h2>Main Content</h2>
      <p>Here is where the main content would go. You can include:</p>
      <ul>
        <li>Bullet points for lists</li>
        <li>Numbered lists for steps</li>
        <li>Code blocks for technical content</li>
      </ul>
      <h2>Conclusion</h2>
      <p>Thanks for reading!</p>
    `);

    return (
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        <Typography variant="h5" gutterBottom>
          Edit Blog Post
        </Typography>
        <TiptapEditor
          value={content}
          onChange={setContent}
          minHeight={400}
          maxHeight={600}
          placeholder="Write your blog post content..."
        />
        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
          <Button variant="outlined">Save Draft</Button>
          <Button variant="contained">Publish</Button>
        </Stack>
      </Box>
    );
  },
};

export const InFormContext: Story = {
  name: 'In Form Context',
  render: () => {
    const [content, setContent] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const hasError = submitted && !content.replace(/<[^>]*>/g, '').trim();

    return (
      <Box component="form" onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Content *
            </Typography>
            <TiptapEditor
              value={content}
              onChange={setContent}
              error={hasError}
              helperText={hasError ? 'Content is required' : 'Format your content using the toolbar'}
              minHeight={200}
            />
          </Box>
          <Button type="submit" variant="contained">
            Submit
          </Button>
        </Stack>
      </Box>
    );
  },
};
