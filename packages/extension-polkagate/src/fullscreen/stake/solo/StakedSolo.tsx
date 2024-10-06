// Copyright 2019-2024 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable react/jsx-max-props-per-line */

import type { AccountStakingInfo, BalancesInfo } from '@polkadot/extension-polkagate/src/util/types';
import type { BN } from '@polkadot/util';

import { faArrowRotateLeft, faBolt, faCircleDown, faClockFour, faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import { Boy as BoyIcon } from '@mui/icons-material';
import { Grid } from '@mui/material';
import React, { useCallback, useMemo } from 'react';
import { useParams } from 'react-router';

import { useAvailableToSoloStake, useStakingRewardDestinationAddress, useStakingRewards, useTranslation, useUnstakingAmount, useUnSupportedNetwork } from '../../../hooks';
import { STAKING_CHAINS } from '../../../util/constants';
import Bread from '../../partials/Bread';
import { Title } from '../../sendFund/InputPage';
import DisplayBalance from '../partials/DisplayBalance';
import ActiveValidators from './partials/ActiveValidators';
import CommonTasks from './partials/CommonTasks';
import Info from './partials/Info';
import RewardsChart from './partials/RewardsChart';
import StakedBar from './StakedBar';
import { MODAL_IDS } from '.';

interface Props {
  setShow: React.Dispatch<React.SetStateAction<number>>;
  refresh: boolean;
  setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
  stakingAccount: AccountStakingInfo | null | undefined;
  balances: BalancesInfo | undefined
}

export default function StakedSolo ({ balances, refresh, setRefresh, setShow, stakingAccount }: Props): React.ReactElement {
  const { t } = useTranslation();
  const { address } = useParams<{ address: string }>();

  useUnSupportedNetwork(address, STAKING_CHAINS);

  const availableToSoloStake = useAvailableToSoloStake(address, refresh);
  const { toBeReleased, unlockingAmount } = useUnstakingAmount(address, refresh);
  const rewardDestinationAddress = useStakingRewardDestinationAddress(stakingAccount);
  const rewards = useStakingRewards(address, stakingAccount);

  const redeemable = useMemo(() => stakingAccount?.redeemable, [stakingAccount?.redeemable]);
  const staked = useMemo(() => stakingAccount?.stakingLedger?.active as unknown as BN, [stakingAccount?.stakingLedger?.active]);

  const onUnstake = useCallback(() => {
    setShow(MODAL_IDS.UNSTAKE);
  }, [setShow]);

  const onStakeOrExtra = useCallback(() => {
    staked && !staked.isZero()
      ? setShow(MODAL_IDS.STAKE_EXTRA)
      : setShow(MODAL_IDS.STAKE);
  }, [setShow, staked]);

  const onFastUnstake = useCallback(() => {
    setShow(MODAL_IDS.FAST_UNSTAKE);
  }, [setShow]);

  const onPendingRewards = useCallback(() => {
    setShow(MODAL_IDS.PENDING);
  }, [setShow]);

  const onRedeemableWithdraw = useCallback(() => {
    redeemable && !redeemable?.isZero() && setShow(MODAL_IDS.REDEEM);
  }, [redeemable, setShow]);

  const onReStake = useCallback(() => {
    unlockingAmount && !unlockingAmount?.isZero() && setShow(MODAL_IDS.RE_STAKE);
  }, [setShow, unlockingAmount]);

  return (
    <Grid container item justifyContent='center' sx={{ bgcolor: 'backgroundFL.secondary', display: 'block', height: 'calc(100vh - 70px)', maxWidth: '1282px', overflow: 'scroll', px: '2%' }}>
      <Bread />
      <Title
        height='70px'
        logo={<BoyIcon sx={{ color: 'text.primary', fontSize: '60px' }} />}
        ml='-20px'
        padding='0px'
        spacing={0}
        text={t('Staked Solo')}
      />
      <Grid container item justifyContent='space-between' mb='15px'>
        <Grid container direction='column' item mb='10px' minWidth='715px' rowGap='10px' width='calc(100% - 320px - 3%)'>
          <StakedBar
            availableBalance={availableToSoloStake}
            balances={balances}
            redeemable={redeemable}
            staked={staked}
            unlockingAmount={unlockingAmount}
          />
          <Grid container item>
            <DisplayBalance
              actions={[t('unstake'), t('fast unstake')]}
              address={address}
              amount={staked as unknown as BN}
              icons={[faMinus, faBolt]}
              marginTop='0px'
              onClicks={[onUnstake, onFastUnstake]}
              title={t('Staked')}
            />
            <DisplayBalance
              actions={[t('pending')]}
              address={address}
              amount={rewards}
              icons={[faClockFour]}
              onClicks={[onPendingRewards]}
              title={t('Rewards paid')}
            />
            <DisplayBalance
              actions={[t('withdraw')]}
              address={address}
              amount={redeemable}
              icons={[faCircleDown]}
              onClicks={[onRedeemableWithdraw]}
              title={t('Redeemable')}
            />
            <DisplayBalance
              actions={[t('restake')]}
              address={address}
              amount={unlockingAmount}
              icons={[faArrowRotateLeft]}
              isUnstaking
              onClicks={[onReStake]}
              title={t('Unstaking')}
              toBeReleased={toBeReleased}
            />
            <DisplayBalance
              actions={[staked && !staked.isZero() ? t('stake extra') : t('stake')]}
              address={address}
              amount={availableToSoloStake}
              icons={[faPlus]}
              onClicks={[onStakeOrExtra]}
              title={t('Available to stake')}
            />
            <Info
              address={address}
            />
          </Grid>
        </Grid>
        <Grid container direction='column' gap='15px' item width='320px'>
          <RewardsChart
            address={address}
            rewardDestinationAddress={rewardDestinationAddress}
          />
          <ActiveValidators
            address={address}
          />
          <CommonTasks
            address={address}
            setRefresh={setRefresh}
            staked={staked}
          />
        </Grid>
      </Grid>
    </Grid>
  );
}
