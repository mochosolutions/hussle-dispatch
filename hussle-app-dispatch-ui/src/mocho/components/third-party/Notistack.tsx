import {ReactNode} from 'react';
import {styled} from '@mui/material/styles';
import {SnackbarProvider} from 'notistack';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';

// custom styles
const StyledSnackbarProvider = styled(SnackbarProvider)(({theme}) => ({
  '&.notistack-MuiContent-default': {
    backgroundColor: theme.palette.primary.main,
  },
  '&.notistack-MuiContent-error': {
    backgroundColor: theme.palette.error.main,
  },
  '&.notistack-MuiContent-success': {
    backgroundColor: theme.palette.success.main,
  },
  '&.notistack-MuiContent-info': {
    backgroundColor: theme.palette.info.main,
  },
  '&.notistack-MuiContent-warning': {
    backgroundColor: theme.palette.warning.main,
  },
}));

// ==============================|| NOTISTACK - TYPES ||============================== //

export interface NotistackProps {
  /** Child components */
  children: ReactNode;

  /** Maximum number of snackbars to display at once (default: 3) */
  maxSnack?: number;

  /** Use dense spacing (default: false) */
  dense?: boolean;

  /** Icon variant: 'useemojis' to show icons, 'hide' to hide icons, undefined for default */
  iconVariant?: 'useemojis' | 'hide';
}

// ==============================|| NOTISTACK ||============================== //

const Notistack = ({
  children,
  maxSnack = 3,
  dense = false,
  iconVariant,
}: NotistackProps) => {
  const iconSX = {marginRight: 8, fontSize: '1.15rem'};

  return (
    <StyledSnackbarProvider
      maxSnack={maxSnack}
      dense={dense}
      iconVariant={
        iconVariant === 'useemojis'
          ? {
              success: <CheckCircleOutlined style={iconSX} />,
              error: <CloseCircleOutlined style={iconSX} />,
              warning: <WarningOutlined style={iconSX} />,
              info: <InfoCircleOutlined style={iconSX} />,
            }
          : undefined
      }
      hideIconVariant={iconVariant === 'hide'}
    >
      {children}
    </StyledSnackbarProvider>
  );
};

export default Notistack;
