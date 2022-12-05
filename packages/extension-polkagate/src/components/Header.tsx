// Copyright 2019-2022 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description
 * this component opens a header on top of pages except the accounts page
 * */

import { ArrowBackIosNewRounded as BackIcon, Menu as MenuIcon } from '@mui/icons-material';
import { Box, Grid, IconButton, useTheme } from '@mui/material';
import React, { useCallback } from 'react';
import { useHistory } from 'react-router-dom';

import { logoBlack, logoWhite } from '../assets/logos/';

interface Props {
  children?: React.ReactNode;
  icon: React.node;
  preUrl?: string;
  state?: any;
  showLogo?: boolean;
}

export default function Header({ children, icon, preUrl = '/', state = {}, showLogo }: Props): React.ReactElement<Props> {
  const history = useHistory();
  const theme = useTheme();

  const gotoPreUrl = useCallback(() => {
    history.push({
      pathname: preUrl,
      state
    });
  }, [history, preUrl, state]);

  return (
    <>
      <Grid alignItems='center' container justifyContent='flex-end' pt='15px'>
        <Grid item xs={4}>
          {showLogo
            ? <Box component='img' sx={{ height: 45, width: 45 }} src={theme.palette.mode === 'dark' ? logoWhite : logoBlack} />
            : preUrl && <IconButton
              aria-label='menu'
              color='inherit'
              edge='start'
              onClick={gotoPreUrl}
              size='small'
              sx={{ p: '0px' }}
            >
              <BackIcon sx={{ color: 'secondary.main', fontSize: '30px' }} />
            </IconButton>
          }
        </Grid>
        <Grid item textAlign='center' m='auto' width='fit-content' >
          {icon}
        </Grid>
        <Grid item textAlign='right' xs={4}>
          <IconButton
            aria-label='menu'
            color='inherit'
            edge='start'
            // onClick={_toggleSettings}
            size='small'
            sx={{ p: '0px' }}
          >
            <MenuIcon sx={{ color: 'secondary.main', fontSize: 40 }} />
          </IconButton>
        </Grid>
      </Grid>
      {children}
    </>
  );
}