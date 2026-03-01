import {SyntheticEvent} from 'react';

// material-ui
import {Alert, Button, Fade, Grow, Slide, SlideProps} from '@mui/material';
import MuiSnackbar from '@mui/material/Snackbar';

// project-import
import IconButton from './IconButton';

// assets
import {CloseOutlined} from '@ant-design/icons';

// types
import {KeyedObject} from '../../types/root';

// animation function
function TransitionSlideLeft(props: SlideProps) {
  return <Slide {...props} direction="left" />;
}

function TransitionSlideUp(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

function TransitionSlideRight(props: SlideProps) {
  return <Slide {...props} direction="right" />;
}

function TransitionSlideDown(props: SlideProps) {
  return <Slide {...props} direction="down" />;
}

function GrowTransition(props: SlideProps) {
  return <Grow {...props} />;
}

// animation options
const animation: KeyedObject = {
  SlideLeft: TransitionSlideLeft,
  SlideUp: TransitionSlideUp,
  SlideRight: TransitionSlideRight,
  SlideDown: TransitionSlideDown,
  Grow: GrowTransition,
  Fade,
};

// ==============================|| SNACKBAR - TYPES ||============================== //

export interface SnackbarProps {
  /** Whether the snackbar is open */
  open: boolean;

  /** The message to display */
  message: string;

  /** Snackbar variant */
  variant?: 'default' | 'alert';

  /** Auto hide duration in milliseconds (default: 6000) */
  autoHideDuration?: number;

  /** Anchor position */
  anchorOrigin?: {
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
  };

  /** Transition animation */
  transition?: 'SlideLeft' | 'SlideUp' | 'SlideRight' | 'SlideDown' | 'Grow' | 'Fade';

  /** Show action button */
  actionButton?: boolean;

  /** Show close button */
  close?: boolean;

  /** Alert configuration (for variant='alert') */
  alert?: {
    variant?: 'filled' | 'outlined' | 'standard';
    color?: 'success' | 'error' | 'warning' | 'info';
  };

  /** Callback when snackbar closes */
  onClose: () => void;
}

// ==============================|| SNACKBAR ||============================== //

const Snackbar = ({
  open,
  message,
  variant = 'default',
  autoHideDuration = 6000,
  anchorOrigin = { vertical: 'bottom', horizontal: 'right' },
  transition = 'SlideUp',
  actionButton = true,
  close = true,
  alert = {
    variant: 'filled',
    color: 'success',
  },
  onClose,
}: SnackbarProps) => {
  const handleClose = (event: SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    onClose();
  };

  return (
    <>
      {/* default snackbar */}
      {variant === 'default' && (
        <MuiSnackbar
          anchorOrigin={anchorOrigin}
          open={open}
          autoHideDuration={autoHideDuration}
          onClose={handleClose}
          message={message}
          TransitionComponent={animation[transition]}
          action={
            <>
              <Button color="secondary" size="small" onClick={handleClose}>
                UNDO
              </Button>
              <IconButton
                size="small"
                aria-label="close"
                color="inherit"
                onClick={handleClose}
                sx={{mt: 0.25}}
              >
                <CloseOutlined />
              </IconButton>
            </>
          }
        />
      )}

      {/* alert snackbar */}
      {variant === 'alert' && (
        <MuiSnackbar
          TransitionComponent={animation[transition]}
          anchorOrigin={anchorOrigin}
          open={open}
          autoHideDuration={autoHideDuration}
          onClose={handleClose}
        >
          <Alert
            variant={alert.variant}
            color={alert.color}
            action={
              <>
                {actionButton !== false && (
                  <Button
                    color={alert.color}
                    size="small"
                    onClick={handleClose}
                  >
                    UNDO
                  </Button>
                )}
                {close !== false && (
                  <IconButton
                    sx={{mt: 0.25}}
                    size="small"
                    aria-label="close"
                    variant="contained"
                    color={alert.color}
                    onClick={handleClose}
                  >
                    <CloseOutlined />
                  </IconButton>
                )}
              </>
            }
            sx={{
              ...(alert.variant === 'outlined' && {
                bgcolor: 'grey.0',
              }),
            }}
          >
            {message}
          </Alert>
        </MuiSnackbar>
      )}
    </>
  );
};

export default Snackbar;
