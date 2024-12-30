// Copyright 2019-2024 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable react/jsx-max-props-per-line */

import type { DropdownOption } from '../../../util/types';

import { Close as CloseIcon } from '@mui/icons-material';
import { Divider, Grid, IconButton, Typography, useTheme } from '@mui/material';
import React, { useCallback, useMemo, useState } from 'react';

import { ChainLogo, PButton, SlidePopUp, Switch } from '../../../components';
import { useTranslation } from '../../../components/translate';

interface Props {
  options: DropdownOption[];
  previousState: DropdownOption[];
  onApply: (items: DropdownOption[]) => () => void;
  type: 'stakingReward' | 'governance';
  onClose: () => void;
}

const RELAY_CHAINS = ['polkadot', 'kusama'];

const SelectNetwork = ({ onApply, onClose, options, previousState, type }: Props): React.ReactElement => {
  const { t } = useTranslation();
  const theme = useTheme();

  const [selected, setSelected] = useState<DropdownOption[]>(previousState);

  const onSelect = useCallback((item: DropdownOption) => () => {
    setSelected((prevSelected) =>
      prevSelected.includes(item)
        ? prevSelected.filter((selectedItem) => selectedItem !== item)
        : [...prevSelected, item]
    );
  }, []);

  const isSelectionUnchanged = useMemo(() => {
    return selected.length === previousState.length &&
      selected.every((item) => previousState.includes(item)) &&
      previousState.every((item) => selected.includes(item));
  }, [selected, previousState]);

  const isRelayChain = useCallback((chain: string) => {
    const itIs = RELAY_CHAINS.includes(chain);
    const base = chain.charAt(0).toUpperCase() + chain.slice(1);

    if (!itIs) {
      return base;
    } else {
      return base + ' Relay Chain';
    }
  }, []);

  const page = (
    <Grid alignItems='flex-start' bgcolor='background.default' container display='block' item mt='46px' sx={{ borderRadius: '10px 10px 0px 0px', height: 'parent.innerHeight' }} width='100%'>
      <Grid container justifyContent='center' mt='40px'>
        <Typography fontSize='22px' fontWeight={400} sx={{ textAlign: 'center', textTransform: 'uppercase', width: '100%' }}>
          {type === 'governance'
            ? t('governance')
            : t('staking reward')
          }
        </Typography>
        <Divider sx={{ bgcolor: 'secondary.main', height: '2px', mt: '5px', width: '240px' }} />
      </Grid>
      <Grid alignItems='center' container item sx={{ maxHeight: '350px', overflowY: 'scroll', p: '30px 15px 0' }}>
        {options.map((option, index) => (
          <Grid alignItems='center' container item justifyContent='space-between' key={index}>
            <Grid alignItems='center' columnGap='10px' container item width='fit-content'>
              <ChainLogo chainName={option.text} />
              <Typography fontSize='16px' fontWeight={400}>
                {isRelayChain(option.text)}
              </Typography>
            </Grid>
            <Switch
              isChecked={selected.includes(option)}
              onChange={onSelect(option)}
              theme={theme}
            />
          </Grid>
        ))}
      </Grid>
      <PButton
        _onClick={onApply(selected)}
        disabled={isSelectionUnchanged}
        text={t('Apply')}
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
      <SlidePopUp show>
        {page}
      </SlidePopUp>
    </Grid>
  );
};

export default React.memo(SelectNetwork);
