// Copyright 2019-2024 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable sort-keys */

import type { ThemeOptions, TypeText } from '@mui/material';

import { baseTheme } from './baseTheme';

declare module '@mui/material/styles' {
  interface Palette {
    aye: Palette['primary'];
    nay: Palette['primary'];
    label: Palette['primary'];
    approval: Palette['primary'];
    support: Palette['primary'];
    backgroundFL: TypeText;
  }
  interface PaletteOptions {
    approval?: PaletteOptions['primary'];
    aye?: PaletteOptions['primary'];
    nay?: PaletteOptions['primary'];
    label?: PaletteOptions['primary'];
    support?: PaletteOptions['primary'];
    backgroundFL?: Partial<TypeText>;
  }
}

export const lightTheme: ThemeOptions = {
  ...baseTheme,
  palette: {
    mode: 'light',
    primary: { main: '#99004F', light: '#838383', contrastText: '#F1F1F1' },
    secondary: { main: '#99004F', light: '#BA2882', contrastText: '#747474' },
    support: { main: '#BCE2DB', contrastText: '#008080' },
    approval: { main: '#BA82A4', contrastText: '#DFCBD7' },
    aye: { main: '#008080' },
    nay: { main: '#FF5722' },
    label: { main: '#FFFFFF' },
    background: { default: '#F1F1F1', paper: '#fff' },
    backgroundFL: { primary: '#DFDFDF', secondary: '#F1F1F1' },
    text: { primary: '#63364D', secondary: '#FFFFFF', disabled: '#747474' },
    action: { disabled: '#fff', disabledBackground: '#989898', focus: '#BA82A5' },
    success: { main: '#1F7720', light: '#46890C' },
    warning: { main: '#FF002B' },
    divider: '#cecece'
  },
  components: {
    MuiSkeleton: {
      styleOverrides:
      {
        root: {
          backgroundColor: 'grey.200'
        }
      }
    }
  },
  typography: {
    allVariants: {
      fontWeight: 400,
      fontFamily: 'Roboto',
      letterSpacing: '-0.015em'
    }
  }
};
