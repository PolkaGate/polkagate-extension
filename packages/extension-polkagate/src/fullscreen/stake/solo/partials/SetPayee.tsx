// Copyright 2019-2024 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable react/jsx-max-props-per-line */

import type { SxProps } from '@mui/material';
import type { Payee } from '@polkadot/extension-polkagate/src/util/types';

import { FormControl, FormControlLabel, FormLabel, Grid, Radio, RadioGroup, Skeleton, Typography, useTheme } from '@mui/material';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { amountToHuman } from '@polkadot/extension-polkagate/src/util/utils';

import { AccountInputWithIdentity, Warning } from '../../../../components';
import { useInfo, useStakingConsts, useTranslation } from '../../../../hooks';

interface Props {
  address: string | undefined;
  title?: string;
  set: React.Dispatch<React.SetStateAction<Payee | undefined>>
}

export default function SetPayee ({ address, set, title }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const theme = useTheme();
  const { chain, decimal, formatted, token } = useInfo(address);

  const stakingConsts = useStakingConsts(address);

  const [rewardDestinationValue, setRewardDestinationValue] = useState<'Staked' | 'Others'>('Staked');
  const [rewardDestinationAccount, setRewardDestinationAccount] = useState<string | null>();

  const ED = useMemo(() => stakingConsts?.existentialDeposit && decimal && amountToHuman(stakingConsts.existentialDeposit, decimal), [decimal, stakingConsts?.existentialDeposit]);

  const onSelectionMethodChange = useCallback((_event: React.ChangeEvent<HTMLInputElement>, value: string): void => {
    setRewardDestinationValue(value as 'Staked' | 'Others');

    if (value === 'Staked') {
      setRewardDestinationAccount(undefined);// to reset
    }
  }, []);

  const makePayee = useCallback((value: 'Staked' | 'Others', account?: string | null) => {
    if (value === 'Staked') {
      return 'Staked';
    }

    if (account === formatted) {
      return 'Stash';
    }

    if (account) {
      return { Account: account };
    }

    return undefined;
  }, [formatted]);

  useEffect(() => {
    if (!rewardDestinationValue) {
      return;
    }

    const newPayee = makePayee(rewardDestinationValue, rewardDestinationAccount);

    set(newPayee);
  }, [makePayee, rewardDestinationAccount, rewardDestinationValue, set]);

  const Warn = ({ style = {}, text }: { text: string, style?: SxProps }) => (
    <Grid container justifyContent='center' sx={style}>
      <Warning
        fontWeight={400}
        theme={theme}
      >
        {text}
      </Warning>
    </Grid>
  );

  return (
    <Grid container item sx={{ display: 'block', height: '300px' }}>
      <Grid container item justifyContent='flex-start' width='100%'>
        <FormControl sx={{ textAlign: 'left' }}>
          <FormLabel sx={{ '&.Mui-focused': { color: 'text.primary' }, color: 'text.primary', fontSize: '16px' }}>
            {title || t('Reward destination')}
          </FormLabel>
          {rewardDestinationValue
            ? <RadioGroup defaultValue={rewardDestinationValue} onChange={onSelectionMethodChange}>
              <FormControlLabel control={<Radio size='small' sx={{ color: 'secondary.main' }} value='Staked' />} label={<Typography sx={{ fontSize: '18px' }}>{t('Add to staked amount')}</Typography>} />
              <FormControlLabel control={<Radio size='small' sx={{ color: 'secondary.main', py: '2px' }} value='Others' />} label={<Typography sx={{ fontSize: '18px' }}>{t('Transfer to a specific account')}</Typography>} />
            </RadioGroup>
            : <Skeleton
              animation='wave'
              height={20}
              sx={{ display: 'inline-block', fontWeight: 'bold', mt: '10px', transform: 'none', width: '200px' }}
            />
          }
        </FormControl>
      </Grid>
      {rewardDestinationValue === 'Others' &&
        <>
          <AccountInputWithIdentity
            address={rewardDestinationAccount}
            chain={chain}
            label={t('Specific account')}
            setAddress={setRewardDestinationAccount}
            style={{ pt: '25px', px: '15px' }}
          />
          <Warn style={{ mt: '-20px' }} text={t('The balance for the recipient must be at least {{ED}} in order to keep the amount.', { replace: { ED: `${ED} ${token}` } })} />
        </>
      }
    </Grid>
  );
}
