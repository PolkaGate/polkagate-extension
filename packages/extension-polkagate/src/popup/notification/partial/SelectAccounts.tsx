// Copyright 2019-2024 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable react/jsx-max-props-per-line */

import { Close as CloseIcon } from '@mui/icons-material';
import { Divider, Grid, IconButton, Typography, useTheme } from '@mui/material';
import React, { useCallback, useContext, useMemo, useState } from 'react';

import { AccountContext, Identity, PButton, SlidePopUp, Switch } from '../../../components';
import { useTranslation } from '../../../components/translate';
import { MAX_ACCOUNT_COUNT_NOTIFICATION } from '../constant';

interface Props {
  previousState: string[];
  onApply: (items: string[]) => () => void;
  onClose: () => void;
}

const SelectAccounts = ({ onApply, onClose, previousState }: Props): React.ReactElement => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { accounts } = useContext(AccountContext);

  const [selected, setSelected] = useState<string[]>(previousState);

  const onSelect = useCallback((item: string) => () => {
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

  const page = (
    <Grid alignItems='flex-start' bgcolor='background.default' container display='block' item mt='46px' sx={{ borderRadius: '10px 10px 0px 0px', height: 'parent.innerHeight' }} width='100%'>
      <Grid container justifyContent='center' mt='40px'>
        <Typography fontSize='22px' fontWeight={400} sx={{ textAlign: 'center', textTransform: 'uppercase', width: '100%' }}>
          {t('accounts')}
        </Typography>
        <Divider sx={{ bgcolor: 'secondary.main', height: '2px', mt: '5px', width: '240px' }} />
        <Typography fontSize='16px' fontWeight={300} p='20px'>
          {t('Select up to {{count}} accounts to be notified when account activity', { replace: { count: MAX_ACCOUNT_COUNT_NOTIFICATION } })}
        </Typography>
      </Grid>
      <Grid alignItems='center' container item sx={{ maxHeight: '320px', overflowY: 'scroll', p: '30px 15px 0' }}>
        {accounts.map(({ address }, index) => (
          <Grid container item key={index}>
            <Grid alignItems='center' container item justifyContent='left' xs={10}>
              <Identity address={address} identiconSize={25} showShortAddress showSocial={false} style={{ fontSize: '14px' }} subIdOnly />
            </Grid>
            <Grid alignItems='center' container height='100%' item justifyContent='center' xs={2}>
              <Switch
                isChecked={selected.includes(address)}
                onChange={onSelect(address)}
                theme={theme}
              />
            </Grid>
          </Grid>
        ))}
      </Grid>
      <PButton
        _onClick={onApply(selected)}
        disabled={isSelectionUnchanged || selected.length > MAX_ACCOUNT_COUNT_NOTIFICATION}
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

export default React.memo(SelectAccounts);
