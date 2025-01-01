// Copyright 2019-2024 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable react/jsx-no-bind */
/* eslint-disable react/jsx-max-props-per-line */

import type { Icon } from 'iconsax-react';

import { Grid, type SxProps, type Theme, Typography, useTheme } from '@mui/material';
import React, { useCallback, useState } from 'react';

import { noop } from '@polkadot/util';

interface Props {
  disabled?: boolean;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  StartIcon?: Icon;
  EndIcon?: Icon;
  text: string;
  contentPlacement?: 'start' | 'center' | 'end';
  style?: React.CSSProperties;
}

export default function GradientButton ({ EndIcon, StartIcon, contentPlacement = 'center', disabled, onClick, style, text }: Props): React.ReactElement<Props> {
  const theme = useTheme();

  const [hovered, setHovered] = useState<boolean>(false);

  const toggleHovered = useCallback(() => {
    !disabled && setHovered(!hovered);
  }, [disabled, hovered]);

  const GradientButtonStyle = {
    alignItems: 'center',
    bgcolor: 'transparent',
    border: 'unset',
    cursor: disabled ? 'default' : 'pointer',
    justifyContent: { center: 'center', end: 'flex-end', start: 'flex-start' }[contentPlacement],
    opacity: disabled ? 0.3 : 1,
    paddingInline: '24px',
    position: 'relative',
    ...style
  } as SxProps<Theme>;

  const GradientBackground = {
    /* ON HOVER EFFECT */
    '&::after': {
      background: '#6E00B1',
      borderRadius: `${style?.borderRadius ?? '12px'}`,
      content: '""',
      inset: '-2px',
      opacity: hovered ? 1 : 0,
      position: 'absolute',
      transition: 'all 250ms ease-out',
      zIndex: 1
    },
    /* BORDER GRADIENT */
    '&::before': {
      background: 'linear-gradient(90deg, #AA0DEB 0%, #FF91E7 50%, #AA0DEB 100%)',
      borderRadius: `${style?.borderRadius ?? '12px'}`,
      content: '""',
      inset: '-2px',
      opacity: hovered ? 0 : 1,
      position: 'absolute',
      transition: 'all 250ms ease-out',
      zIndex: -1
    },
    /* BUTTON BACKGROUND GRADIENT */
    background: 'linear-gradient(262.56deg, #6E00B1 0%, #DC45A0 45%, #6E00B1 100%)',
    borderRadius: `${style?.borderRadius ?? '12px'}`,
    inset: 0,
    position: 'absolute',
    transition: 'all 250ms ease-out'
  } as SxProps<Theme>;

  return (
    <Grid component='button' container item onClick={disabled ? noop : onClick} onMouseEnter={toggleHovered} onMouseLeave={toggleHovered} sx={GradientButtonStyle}>
      {StartIcon && <StartIcon color={theme.palette.text.primary} size='20' style={{ zIndex: 10 }} variant='Bulk' />}
      <Typography sx={{ fontFamily: 'Inter', fontSize: '14px', fontWeight: 600, px: '10px', width: 'fit-content', zIndex: 10 }}>
        {text}
      </Typography>
      {EndIcon && <EndIcon color={theme.palette.text.primary} size='20' style={{ zIndex: 10 }} variant='Bulk' />}
      <Grid sx={GradientBackground}></Grid>
    </Grid>
  );
}