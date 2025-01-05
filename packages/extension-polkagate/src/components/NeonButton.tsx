// Copyright 2019-2025 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable react/jsx-max-props-per-line */

import type { Icon } from 'iconsax-react';

import { Button, useTheme } from '@mui/material';
import React, { useCallback, useMemo, useState } from 'react';

interface Props {
  disabled?: boolean;
  isBusy?: boolean;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  StartIcon?: Icon;
  EndIcon?: Icon;
  contentPlacement?: 'start' | 'center' | 'end';
  text: string | { firstPart?: string; secondPart?: string; };
  variant?: 'text' | 'contained' | 'outlined';
  style?: React.CSSProperties;
}

export default function NeonButton ({ EndIcon, StartIcon, contentPlacement = 'start', disabled, isBusy, onClick, style, text, variant }: Props): React.ReactElement<Props> {
  const theme = useTheme();

  const [hovered, setHovered] = useState(false);

  const toggleHover = useCallback(() => setHovered((isHovered) => !isHovered), []);

  const ButtonFontStyle = useMemo(() => ({
    color: hovered ? '#FF4FB9' : '#BEAAD8',
    fontFamily: 'Inter',
    fontSize: '14px',
    fontWeight: 600,
    justifyContent: { center: 'center', end: 'flex-end', start: 'flex-start' }[contentPlacement],
    textTransform: 'none'
  } as React.CSSProperties), [contentPlacement, hovered]);

  const GeneralButtonStyle = {
    background: 'transparent',
    border: '1px solid',
    borderColor: hovered ? '#FF4FB9' : '#2D1E4A',
    borderRadius: `${style?.borderRadius ?? '12px'}`,
    boxShadow: 'unset',
    padding: '6px 24px',
    transition: 'all 250ms ease-out',
    ...ButtonFontStyle
  };

  const StartIconStyle = {
    '& .MuiButton-startIcon': {
      marginLeft: 0,
      marginRight: '10px'
    },
    '& .MuiButton-startIcon svg': {
      color: hovered ? '#FF4FB9' : '#BEAAD8',
      transition: 'all 250ms ease-out'
    }
  };

  const EndIconStyle = {
    '& .MuiButton-endIcon': {
      marginLeft: '5px',
      marginRight: 0
    },
    '& .MuiButton-endIcon svg': {
      color: hovered ? '#FF4FB9' : '#BEAAD8',
      transition: 'all 250ms ease-out'
    }
  };

  const renderText = useMemo(() => {
    if (typeof text === 'string') {
      return <span style={{ color: theme.palette.text.primary, ...ButtonFontStyle }}>{text}</span>;
    } else {
      return (
        <>
          <span style={{ color: theme.palette.text.secondary, ...ButtonFontStyle }}>{text.firstPart}</span>&nbsp;<span style={{ color: theme.palette.text.primary, ...ButtonFontStyle }}>{text.secondPart}</span>
        </>
      );
    }
  }, [ButtonFontStyle, text, theme.palette.text.primary, theme.palette.text.secondary]);

  return (
    <Button
      disabled={disabled || isBusy}
      endIcon={EndIcon
        ? <EndIcon size={20} variant={hovered ? 'Bold' : 'Bulk'} />
        : undefined}
      onClick={onClick}
      onMouseEnter={toggleHover}
      onMouseLeave={toggleHover}
      startIcon={StartIcon
        ? <StartIcon size={20} variant={hovered ? 'Bold' : 'Bulk'} />
        : undefined}
      sx={{ ...GeneralButtonStyle, ...StartIconStyle, ...EndIconStyle, ...style }}
      variant={variant}
    >
      {renderText}
    </Button>
  );
}