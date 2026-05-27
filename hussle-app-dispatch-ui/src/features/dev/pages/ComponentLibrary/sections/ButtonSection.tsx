import { Box, Button, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';

const ButtonSection = () => (
  <Box>
    <Box sx={{ mb: 4 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
        Contained
      </Typography>
      <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
        <Button variant="contained" color="primary">
          Primary
        </Button>
        <Button variant="contained" color="secondary">
          Secondary
        </Button>
        <Button variant="contained" color="error">
          Error
        </Button>
        <Button variant="contained" color="warning">
          Warning
        </Button>
        <Button variant="contained" color="info">
          Info
        </Button>
        <Button variant="contained" color="success">
          Success
        </Button>
        <Button variant="contained" disabled>
          Disabled
        </Button>
      </Stack>
    </Box>

    <Box sx={{ mb: 4 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
        Outlined
      </Typography>
      <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
        <Button variant="outlined" color="primary">
          Primary
        </Button>
        <Button variant="outlined" color="secondary">
          Secondary
        </Button>
        <Button variant="outlined" color="error">
          Error
        </Button>
        <Button variant="outlined" disabled>
          Disabled
        </Button>
      </Stack>
    </Box>

    <Box sx={{ mb: 4 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
        Text
      </Typography>
      <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
        <Button variant="text" color="primary">
          Primary
        </Button>
        <Button variant="text" color="secondary">
          Secondary
        </Button>
        <Button variant="text" color="error">
          Cancel
        </Button>
        <Button variant="text" disabled>
          Disabled
        </Button>
      </Stack>
    </Box>

    <Box sx={{ mb: 4 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
        With Icons
      </Typography>
      <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
        <Button variant="contained" startIcon={<PlusOutlined />}>
          Create Load
        </Button>
        <Button variant="outlined" startIcon={<EditOutlined />}>
          Edit
        </Button>
        <Button variant="outlined" color="error" startIcon={<DeleteOutlined />}>
          Delete
        </Button>
        <Button variant="contained" startIcon={<SearchOutlined />}>
          Search
        </Button>
      </Stack>
    </Box>

    <Box sx={{ mb: 4 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
        Sizes
      </Typography>
      <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
        <Button variant="contained" size="small">
          Small
        </Button>
        <Button variant="contained" size="medium">
          Medium
        </Button>
        <Button variant="contained" size="large">
          Large
        </Button>
      </Stack>
    </Box>

    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
        Icon Buttons
      </Typography>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
        <Tooltip title="Add">
          <IconButton color="primary" aria-label="add">
            <PlusOutlined />
          </IconButton>
        </Tooltip>
        <Tooltip title="Edit">
          <IconButton color="secondary" aria-label="edit">
            <EditOutlined />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton color="error" aria-label="delete">
            <DeleteOutlined />
          </IconButton>
        </Tooltip>
        <Tooltip title="Disabled">
          <span>
            <IconButton disabled aria-label="disabled">
              <SearchOutlined />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
    </Box>
  </Box>
);

export default ButtonSection;
