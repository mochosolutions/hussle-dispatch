import {ComponentClass, FunctionComponent} from 'react';

// material-ui
import {SvgIconTypeMap} from '@mui/material';
import {OverridableComponent} from '@mui/material/OverridableComponent';

// types
// import { AuthProps } from './auth';
import {MenuProps} from './menu';
import {SnackbarProps} from './snackbar';
// import { PipelineProps  } from 'store/reducers/pipelines';

// ==============================|| ROOT TYPES  ||============================== //

export type RootStateProps = {
  // auth: AuthProps;
  menu: MenuProps;
  snackbar: SnackbarProps;
  // pipelines: PipelineProps;
};

export type KeyedObject = {
  [key: string]: string | number | KeyedObject | any;
};

export type OverrideIcon =
  | (OverridableComponent<SvgIconTypeMap<object, 'svg'>> & {
      muiName: string;
    })
  | ComponentClass<any>
  | FunctionComponent<any>;

export interface GenericCardProps {
  title?: string;
  primary?: string | number | undefined;
  secondary?: string;
  content?: string;
  image?: string;
  dateTime?: string;
  iconPrimary?: OverrideIcon;
  color?: string;
  size?: string;
}
