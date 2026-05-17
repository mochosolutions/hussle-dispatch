import type { Theme } from '@mui/material/styles';
import type { SystemStyleObject } from '@mui/system';

interface SelectionCardStateOpts {
  selected: boolean;
  locked?: boolean;
}

export const selectionCardStateSx = ({
  selected,
  locked,
}: SelectionCardStateOpts): SystemStyleObject<Theme> => {
  if (locked) {
    if (selected) {
      return {
        borderColor: 'secondary.light',
        background: (theme) =>
          `linear-gradient(180deg, ${theme.palette.secondary.lighter} 0%, ${theme.palette.background.paper} 65%)`,
        cursor: 'not-allowed',
        opacity: 1,
        boxShadow: 'none',
      };
    }
    return {
      borderColor: 'grey.200',
      bgcolor: 'grey.100',
      cursor: 'not-allowed',
      opacity: 0.55,
      boxShadow: 'none',
    };
  }

  if (selected) {
    return {
      borderColor: 'primary.main',
      background: (theme) =>
        `linear-gradient(180deg, ${theme.palette.primary[100]} 0%, ${theme.palette.background.paper} 60%)`,
      boxShadow: (theme) =>
        `0 0 0 3px ${theme.palette.primary[100]}, 0 4px 12px rgba(15, 23, 42, 0.06)`,
      cursor: 'pointer',
    };
  }

  return {
    borderColor: 'grey.200',
    bgcolor: 'background.paper',
    boxShadow: 'none',
    cursor: 'pointer',
    '&:hover': {
      borderColor: 'grey.300',
      boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)',
      transform: 'translateY(-1px)',
    },
    '&:focus-visible': {
      outline: (theme) => `2px solid ${theme.palette.primary.main}`,
      outlineOffset: 2,
    },
  };
};

export const selectionCardRadioSx = ({
  selected,
  locked,
}: SelectionCardStateOpts): SystemStyleObject<Theme> => {
  const selectedColor = locked ? 'secondary.main' : 'primary.main';

  return {
    width: 18,
    height: 18,
    borderRadius: '50%',
    border: '1.5px solid',
    borderColor: selected ? selectedColor : 'grey.200',
    bgcolor: selected ? selectedColor : 'background.paper',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };
};

const selectedIconBg = (locked: boolean | undefined): string =>
  locked ? 'secondary.main' : 'primary.main';

export const selectionCardIconSx = ({
  selected,
  locked,
}: SelectionCardStateOpts): SystemStyleObject<Theme> => ({
  width: 36,
  height: 36,
  borderRadius: 1,
  bgcolor: selected ? selectedIconBg(locked) : 'primary.100',
  color: selected ? 'common.white' : 'primary.main',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.15s ease',
  flexShrink: 0,
  '& svg': { fontSize: 20 },
});
