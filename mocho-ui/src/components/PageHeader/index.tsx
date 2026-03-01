import React from "react";
import { Typography, Box, Stack, IconButton } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

interface PageHeaderProps {
  showBackButton?: boolean;
  onNavigate?: () => void;
  title: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  showBackButton = false,
  onNavigate,
  title,
  subtitle,
  headerActions,
}) => {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      mb={1}
    >
      <Box display="flex" alignItems="center" gap={2}>
        {showBackButton && onNavigate && (
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            onClick={onNavigate}
          >
            <ArrowBackIcon />
          </IconButton>
        )}
        <Box>
          {title && (
            <Typography variant="h3" component="h1">
              {title}
            </Typography>
          )}
          {subtitle && (
            <Typography variant="subtitle1" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>

      <Box>{headerActions && <Box>{headerActions}</Box>}</Box>
    </Stack>
  );
};

export default PageHeader;
