// Copyright 2019-2024 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable react/jsx-max-props-per-line */

import type { Payee, SoloSettings, StakingConsts } from '../../../../../util/types';

import { FormControl, FormControlLabel, FormLabel, Grid, Radio, RadioGroup, type SxProps, Typography, useTheme } from '@mui/material';
import React, { useCallback, useMemo, useState } from 'react';

import { AccountInputWithIdentity, PButton, Warning } from '../../../../../components';
import { useInfo, useTranslation } from '../../../../../hooks';
import { amountToHuman } from '../../../../../util/utils';
import getPayee from './util';

interface Props {
  address: string | undefined;
  setShow: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  set: React.Dispatch<React.SetStateAction<SoloSettings>>; // This is actually setNewSettings
  stakingConsts: StakingConsts | null | undefined;
  buttonLabel?: string;
  setShowReview?: React.Dispatch<React.SetStateAction<boolean>>;
  settings: SoloSettings;
  newSettings?: SoloSettings; // will be used when user is already has staked
}

export default function SetPayeeController ({ address, buttonLabel, newSettings, set, setShow, setShowReview, settings, stakingConsts }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const theme = useTheme();
  const { api, chain, decimal, formatted, token } = useInfo(address);

  const [controllerId, setControllerId] = useState< string | undefined | null>(settings.controllerId);
  const [rewardDestinationValue, setRewardDestinationValue] = useState<'Staked' | 'Others'>(settings.payee === 'Staked' ? 'Staked' : 'Others');
  const [rewardDestinationAccount, setRewardDestinationAccount] = useState< string | null | undefined>(getPayee(settings));

  const isSettingAtBonding = useMemo(() => !newSettings, [newSettings]);

  const getOptionLabel = useCallback((s: SoloSettings): 'Staked' | 'Others' => s.payee === 'Staked' ? 'Staked' : 'Others', []);
  const isControllerDeprecated = api ? api.tx['staking']['setController'].meta.args.length === 0 : undefined;
  const needToSetControllerToStashID = isControllerDeprecated && formatted !== controllerId;

  const optionDefaultVal = useMemo(() => isSettingAtBonding
    ? getOptionLabel(settings)
    : !newSettings?.payee ? getOptionLabel(settings) : getOptionLabel(newSettings), [getOptionLabel, isSettingAtBonding, newSettings, settings]);

  const ED = useMemo(() => stakingConsts?.existentialDeposit && decimal && amountToHuman(stakingConsts.existentialDeposit, decimal), [decimal, stakingConsts?.existentialDeposit]);
  const onSelectionMethodChange = useCallback((_event: React.ChangeEvent<HTMLInputElement>, value: 'Staked' | 'Others'): void => {
    setRewardDestinationValue(value);

    if (value === 'Staked') {
      setRewardDestinationAccount(undefined);// to reset
    }
  }, []);

  const makePayee = useCallback((rewardDestinationValue: 'Staked' | 'Others', rewardDestinationAccount?: string) => {
    if (rewardDestinationValue === 'Staked') {
      return 'Staked';
    }

    if (rewardDestinationAccount === settings.stashId) {
      return 'Stash';
    }

    if ([settings.controllerId, controllerId].includes(rewardDestinationAccount)) {
      return 'Controller';
    }

    if (rewardDestinationAccount) {
      return { Account: rewardDestinationAccount };
    }

    return undefined;
  }, [controllerId, settings.controllerId, settings.stashId]);

  const payeeNotChanged = useMemo(() => JSON.stringify(settings.payee) === JSON.stringify(makePayee(rewardDestinationValue, rewardDestinationAccount as string)), [makePayee, rewardDestinationAccount, rewardDestinationValue, settings.payee]);

  const onSet = useCallback(() => {
    set((s) => {
      if (isSettingAtBonding) {
        s.controllerId = controllerId as string;
        s.payee = makePayee(rewardDestinationValue, rewardDestinationAccount as string) as Payee;

        return s;
      }

      const payee = makePayee(rewardDestinationValue, rewardDestinationAccount as string);

      if (payee && JSON.stringify(settings.payee) !== JSON.stringify(payee)) {
        s.payee = payee;
      } else {
        s.payee = undefined as unknown as Payee;
      }

      if (controllerId && (s.payee === 'Controller' || settings.controllerId !== controllerId)) {
        s.controllerId = controllerId;
      } else {
        s.controllerId = undefined;
      }

      if (rewardDestinationAccount && s.payee === 'Stash') {
        s.stashId = rewardDestinationAccount;
      } else {
        s.stashId = undefined;
      }

      return s;
    });
    setShowReview && setShowReview(true);
    !setShowReview && setShow(false); // can be left open when settings accessed from home
  }, [controllerId, isSettingAtBonding, makePayee, rewardDestinationAccount, rewardDestinationValue, set, setShow, setShowReview, settings]);

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
    <Grid container item>
      {!isSettingAtBonding && formatted === settings.stashId && formatted !== controllerId &&
        <>
          <AccountInputWithIdentity
            address={controllerId}
            chain={chain}
            disabled={isControllerDeprecated}
            label={isControllerDeprecated ? t('Controller account is deprecated') : t('Controller account')}
            setAddress={isControllerDeprecated ? undefined : setControllerId}
            style={{ pt: '10px', px: '15px' }}
          />
          {needToSetControllerToStashID &&
            <Grid container item>
              <Warning
                fontWeight={300}
                theme={theme}
              >
                {t('Continue to set your controller account to the same as your stash ID.')}
              </Warning>
            </Grid>
          }
        </>
      }
      {(isSettingAtBonding || formatted === settings?.controllerId) &&
        <>
          <Grid item mt='15px' mx='15px' width='100%'>
            <FormControl>
              <FormLabel sx={{ '&.Mui-focused': { color: 'text.primary' }, color: 'text.primary', fontSize: '16px' }}>
                {t('Reward destination')}
              </FormLabel>
              <RadioGroup defaultValue={optionDefaultVal} onChange={onSelectionMethodChange as any}>
                <FormControlLabel control={<Radio size='small' sx={{ color: 'secondary.main' }} value='Staked' />} label={<Typography sx={{ fontSize: '18px' }}>{t('Add to staked amount')}</Typography>} />
                <FormControlLabel control={<Radio size='small' sx={{ color: 'secondary.main', py: '2px' }} value='Others' />} label={<Typography sx={{ fontSize: '18px' }}>{t('Transfer to a specific account')}</Typography>} />
              </RadioGroup>
            </FormControl>
          </Grid>
          {rewardDestinationValue === 'Others' &&
            <>
              <AccountInputWithIdentity
                address={rewardDestinationAccount}
                chain={chain}
                label={t('Specific account')}
                setAddress={setRewardDestinationAccount}
                style={{ pt: '15px', px: '15px' }}
              />
              <Warn style={{ mt: '-20px' }} text={t('The balance for the recipient must be at least {{ED}} in order to keep the amount.', { replace: { ED: `${ED} ${token}` } })} />
            </>
          }
        </>
      }
      <PButton
        _onClick={onSet}
        disabled={needToSetControllerToStashID
          ? false
          : isSettingAtBonding
            ? !controllerId || (rewardDestinationValue === 'Others' && !rewardDestinationAccount)
            : settings.stashId === settings.controllerId
              ? (!controllerId || (controllerId === settings.controllerId && payeeNotChanged)) ||
              (rewardDestinationValue === 'Others' && !rewardDestinationAccount)
              : formatted === settings.stashId
                ? !controllerId || controllerId === settings.controllerId
                : payeeNotChanged || (rewardDestinationValue === 'Others' && !rewardDestinationAccount)
        }
        text={buttonLabel || t('Set')}
      />
    </Grid>
  );
}
