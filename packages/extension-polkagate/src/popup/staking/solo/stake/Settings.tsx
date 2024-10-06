// Copyright 2019-2024 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable react/jsx-max-props-per-line */

import type { SoloSettings, StakingConsts } from '../../../../util/types';

import { Close as CloseIcon } from '@mui/icons-material';
import { Grid, IconButton } from '@mui/material';
import React, { useCallback } from 'react';

import { SlidePopUp } from '../../../../components';
import SetPayeeController from './partials/SetPayeeController';
import SettingsHeader from './partials/SettingsHeader';

interface Props {
  address: string | undefined;
  showAdvanceSettings: boolean;
  setShowAdvanceSettings: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  setSettings: React.Dispatch<React.SetStateAction<SoloSettings>>;
  stakingConsts: StakingConsts | null | undefined;
  settings: SoloSettings;
}

export default function Settings({ address, setSettings, setShowAdvanceSettings, settings, showAdvanceSettings, stakingConsts }: Props): React.ReactElement<Props> {
  const onClose = useCallback(() => setShowAdvanceSettings(false), [setShowAdvanceSettings]);

  const page = (
    <Grid alignItems='flex-start' bgcolor='background.default' container display='block' item mt='46px' sx={{ borderRadius: '10px 10px 0px 0px', height: 'parent.innerHeight' }} width='100%'>
      <SettingsHeader />
      <SetPayeeController
        address={address}
        set={setSettings}
        setShow={setShowAdvanceSettings as any}
        settings={settings}
        stakingConsts={stakingConsts}
      />
      <IconButton
        onClick={onClose}
        sx={{
          left: '15px',
          p: 0,
          position: 'absolute',
          top: '65px'
        }}
      >
        <CloseIcon sx={{ color: 'text.primary', fontSize: 35 }} />
      </IconButton>
    </Grid>
  );

  return (
    <Grid item>
      <SlidePopUp show={showAdvanceSettings}>
        {page}
      </SlidePopUp>
    </Grid>
  );
}
