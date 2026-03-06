import React, {ReactNode} from 'react';
import {styled} from '@mui/material/styles';
// import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';

const LoaderWrapper = styled('div')(({theme}) => ({
  zIndex: 2001,
  width: '100%',
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '& > * + *': {
    marginTop: theme.spacing(2),
  },
}));

interface PageLoaderProps {
  children?: ReactNode;
  open: boolean;
}

export const PageLoader: React.FC<PageLoaderProps> = ({open, children}) => {
  if (open) {
    return (
      <LoaderWrapper>
        <CircularProgress color="primary" />
      </LoaderWrapper>
    );
  }

  return <>{children}</>;
};

export default PageLoader;
