// Copyright 2019-2024 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable react/jsx-max-props-per-line */

import { ArrowForwardIosRounded as ArrowForwardIosRoundedIcon } from '@mui/icons-material';
import { Grid, IconButton, Typography, useTheme } from '@mui/material';
import React, { useCallback, useContext } from 'react';

import { ActionContext, VaadinIcon } from '../components';
import { useTranslation } from '../hooks';
import useIsExtensionPopup from '../hooks/useIsExtensionPopup';
import { windowOpen } from '../messaging';

export default function AddNewAccountButton (): React.ReactElement {
  const theme = useTheme();
  const { t } = useTranslation();
  const isExtensionMode = useIsExtensionPopup();
  const onAction = useContext(ActionContext);

  const onCreate = useCallback((): void => {
    isExtensionMode
      ? windowOpen('/account/create').catch(console.error)
      : onAction('/account/create');
  }, [isExtensionMode, onAction]);

  return (
    <Grid alignItems='center' container justifyContent='space-between' onClick={onCreate} sx={{ '&:hover': { opacity: 1 }, backgroundColor: 'background.paper', borderRadius: '10px', bottom: '20px', cursor: 'pointer', my: isExtensionMode ? '10px' : '20px', opacity: '0.7', padding: 'min(3%, 20px) min(5%, 40px)', position: isExtensionMode ? 'absolute' : 'relative', transition: 'opacity 0.3s ease', width: isExtensionMode ? '92%' : 'inherit', zIndex: 1 }}>
      <Grid container item width='fit-content'>
        <Grid item width='fit-content'>
          <VaadinIcon icon='vaadin:plus-circle' style={{ color: `${theme.palette.secondary.light}`, height: '26px', width: '26px' }} />
        </Grid>
        <Grid alignItems='center' container item textAlign='left' width='fit-content'>
          <Typography fontSize='18px' fontWeight={500} pl='8px'>
            {t('Create a new account')}
          </Typography>
        </Grid>
      </Grid>
      <Grid item width='fit-content'>
        <IconButton sx={{ p: 0 }}>
          <ArrowForwardIosRoundedIcon sx={{ color: 'secondary.light', fontSize: '24px', stroke: `${theme.palette.secondary.light}`, strokeWidth: 1.5 }} />
        </IconButton>
      </Grid>
    </Grid>
  );
}
