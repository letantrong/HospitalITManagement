import React from 'react';
import MuiGrid, { GridProps as MuiGridProps } from '@mui/material/Grid';

export interface AppGridProps extends Omit<MuiGridProps, 'size'> {
  item?: boolean;
  xs?: number | 'auto' | false;
  sm?: number | 'auto' | false;
  md?: number | 'auto' | false;
  lg?: number | 'auto' | false;
  xl?: number | 'auto' | false;
  size?: any;
  alignItems?: any;
  justifyContent?: any;
}

export const Grid: React.FC<AppGridProps> = ({
  item,
  xs,
  sm,
  md,
  lg,
  xl,
  size,
  alignItems,
  justifyContent,
  sx,
  ...props
}) => {
  // Tự động map xs, sm, md, lg sang size của MUI v6
  const computedSize =
    size || (xs !== undefined || sm !== undefined || md !== undefined || lg !== undefined
      ? {
          ...(xs !== undefined && { xs }),
          ...(sm !== undefined && { sm }),
          ...(md !== undefined && { md }),
          ...(lg !== undefined && { lg }),
          ...(xl !== undefined && { xl }),
        }
      : undefined);

  const computedSx = {
    ...(alignItems && { alignItems }),
    ...(justifyContent && { justifyContent }),
    ...sx,
  };

  return <MuiGrid size={computedSize} sx={computedSx} {...props} />;
};

export default Grid;
