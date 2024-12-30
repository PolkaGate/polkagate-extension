// Copyright 2019-2024 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable react/jsx-max-props-per-line */
/* eslint-disable react/jsx-no-bind */

import { ArrowForwardIos as ArrowForwardIosIcon } from '@mui/icons-material';
import { Collapse, Grid, Typography, useTheme } from '@mui/material';
import React, { useCallback, useContext, useEffect, useReducer, useState } from 'react';

import { AccountContext, ActionContext, Switch, TwoButtons } from '../../components';
import { getStorage, setStorage } from '../../components/Loading';
import { useTranslation } from '../../hooks';
import { HeaderBrand } from '../../partials';
import SelectAccounts from './partial/SelectAccounts';
import SelectNetwork from './partial/SelectNetwork';
import { DEFAULT_NOTIFICATION_SETTING, MAX_ACCOUNT_COUNT_NOTIFICATION, NOTIFICATION_SETTING_KEY, SUPPORTED_GOVERNANCE_NOTIFICATION_CHAIN, SUPPORTED_STAKING_NOTIFICATION_CHAIN } from './constant';
import type { DropdownOption } from '@polkadot/extension-polkagate/util/types';

interface OptionButtonProps {
  text: string;
  onClick: () => void;
}

const OptionButton = ({ onClick, text }: OptionButtonProps) => {
  const theme = useTheme();

  return (
    <Grid alignItems='center' container item justifyContent='space-between' onClick={onClick} sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'secondary.main', borderRadius: '5px', cursor: 'pointer', p: '10px' }}>
      <Typography fontSize='16px' fontWeight={400}>
        {text}
      </Typography>
      <ArrowForwardIosIcon sx={{ color: 'secondary.light', fontSize: 18, stroke: theme.palette.secondary.light, strokeWidth: '2px' }} />
    </Grid>
  );
};

export interface NotificationSettingType {
  accounts: string[] | undefined; // substrate addresses
  enable: boolean | undefined;
  receivedFunds: boolean | undefined;
  governance: DropdownOption[] | undefined; // chainNames
  stakingRewards: DropdownOption[] | undefined; // chainNames
}

type NotificationSettingsActionType =
  | { type: 'INITIAL'; payload: NotificationSettingType }
  | { type: 'TOGGLE_ENABLE'; }
  | { type: 'TOGGLE_RECEIVED_FUNDS'; }
  | { type: 'SET_ACCOUNTS'; payload: string[] }
  | { type: 'SET_GOVERNANCE'; payload: DropdownOption[] }
  | { type: 'SET_STAKING_REWARDS'; payload: DropdownOption[] };

const initialNotificationState: NotificationSettingType = {
  accounts: undefined,
  enable: undefined,
  governance: undefined,
  receivedFunds: undefined,
  stakingRewards: undefined
};

const notificationSettingReducer = (
  state: NotificationSettingType,
  action: NotificationSettingsActionType
): NotificationSettingType => {
  switch (action.type) {
    case 'INITIAL':
      return action.payload;
    case 'TOGGLE_ENABLE':
      return { ...state, enable: !state.enable };
    case 'TOGGLE_RECEIVED_FUNDS':
      return { ...state, receivedFunds: !state.receivedFunds };
    case 'SET_GOVERNANCE':
      return { ...state, governance: action.payload };
    case 'SET_ACCOUNTS':
      return { ...state, accounts: action.payload };
    case 'SET_STAKING_REWARDS':
      return { ...state, stakingRewards: action.payload };
    default:
      return state;
  }
};

export enum Popups {
  NONE,
  ACCOUNTS,
  GOVERNANCE,
  STAKING_REWARDS
}

export default function NotificationSettings () {
  const { t } = useTranslation();
  const theme = useTheme();
  const onAction = useContext(ActionContext);
  const { accounts } = useContext(AccountContext);

  const [notificationSetting, dispatch] = useReducer(notificationSettingReducer, initialNotificationState);
  const [defaultFlag, setDefaultFlag] = useState<boolean>(false);
  const [popups, setPopup] = useState<Popups>(Popups.NONE);

  useEffect(() => {
    const loadNotificationSettings = async () => {
      try {
        const storedSettings = await getStorage(NOTIFICATION_SETTING_KEY);

        if (!storedSettings) {
          setDefaultFlag(true);

          return;
        }

        dispatch({
          payload: storedSettings as NotificationSettingType,
          type: 'INITIAL'
        });
      } catch (error) {
        console.error('Failed to load notification settings:', error);
        setDefaultFlag(true);
      }
    };

    loadNotificationSettings().catch(console.error);
  }, []);

  useEffect(() => {
    if (!defaultFlag) {
      return;
    }

    const addresses = accounts.map(({ address }) => address).slice(0, MAX_ACCOUNT_COUNT_NOTIFICATION);

    dispatch({
      payload: {
        ...DEFAULT_NOTIFICATION_SETTING, // accounts is an empty array in the constant file
        accounts: addresses
      },
      type: 'INITIAL'
    });
  }, [accounts, defaultFlag]);

  const onToggleNotification = useCallback(() => {
    dispatch({ type: 'TOGGLE_ENABLE' });
  }, []);

  const onToggleReceivedFunds = useCallback(() => {
    dispatch({ type: 'TOGGLE_RECEIVED_FUNDS' });
  }, []);

  const closePopup = useCallback(() => {
    setPopup(Popups.NONE);
  }, []);

  const onGovernanceChains = useCallback((chains: DropdownOption[]) => () => {
    dispatch({ payload: chains, type: 'SET_GOVERNANCE' });
    closePopup();
  }, [closePopup]);

  const onStakingRewardsChains = useCallback((chains: DropdownOption[]) => () => {
    dispatch({ payload: chains, type: 'SET_STAKING_REWARDS' });
    closePopup();
  }, [closePopup]);

  const onAccounts = useCallback((addresses: string[]) => () => {
    dispatch({ payload: addresses, type: 'SET_ACCOUNTS' });
    closePopup();
  }, [closePopup]);

  const onNotificationApply = useCallback(() => {
    setStorage(NOTIFICATION_SETTING_KEY, notificationSetting).catch(console.error);
    onAction('/');
  }, [notificationSetting, onAction]);

  const onNotificationCancel = useCallback(() => {
    onAction('/');
  }, [onAction]);

  const openPopup = useCallback((popup: Popups) => {
    setPopup(popup);
  }, []);

  return (
    <>
      <HeaderBrand
        onBackClick={onNotificationCancel}
        showBackArrow
        text={t('Manage Notification')}
      />
      <Grid container justifyContent='space-between' sx={{ display: 'block', height: innerHeight - 65, position: 'relative', px: '15px' }}>
        <Typography fontSize='16px' fontWeight={300} mt='15px' textAlign='left' width='100%'>
          {t('Set up notifications to track your accounts, governance updates, and staking rewards.')}
        </Typography>
        <Grid container item justifyContent='space-between'>
          <Grid alignItems='center' container item justifyContent='space-between' mb='40px' mt='20px' pr='10px'>
            <Typography fontSize='16px' fontWeight={400}>
              {t('Enable notifications')}
            </Typography>
            <Switch
              isChecked={notificationSetting.enable}
              onChange={onToggleNotification}
              theme={theme}
            />
          </Grid>
          <Collapse in={notificationSetting.enable} sx={{ width: '100%' }}>
            <Grid alignItems='center' container item justifyContent='space-between' sx={{ pr: '10px', rowGap: '10px' }}>
              <OptionButton
                onClick={() => openPopup(Popups.ACCOUNTS)}
                text={t('Accounts')}
              />
              <OptionButton
                onClick={() => openPopup(Popups.GOVERNANCE)}
                text={t('Governance')}
              />
              <OptionButton
                onClick={() => openPopup(Popups.STAKING_REWARDS)}
                text={t('Staking rewards')}
              />
              <Typography fontSize='16px' fontWeight={400}>
                {t('Received Funds')}
              </Typography>
              <Switch
                isChecked={notificationSetting.receivedFunds}
                onChange={onToggleReceivedFunds}
                theme={theme}
              />
            </Grid>
          </Collapse>
        </Grid>
        <Grid container item sx={{ bottom: '25px', height: '70px', position: 'absolute' }}>
          <TwoButtons
            ml='1%'
            mt='1px'
            onPrimaryClick={onNotificationApply}
            onSecondaryClick={onNotificationCancel}
            primaryBtnText={t('Confirm')}
            secondaryBtnText={t('Cancel')}
            width='90%'
          />
        </Grid>
      </Grid>
      {Popups.GOVERNANCE === popups
        ? <SelectNetwork onApply={onGovernanceChains} onClose={closePopup} options={SUPPORTED_GOVERNANCE_NOTIFICATION_CHAIN} previousState={notificationSetting.governance ?? []} type='governance' />
        : Popups.STAKING_REWARDS === popups
          ? <SelectNetwork onApply={onStakingRewardsChains} onClose={closePopup} options={SUPPORTED_STAKING_NOTIFICATION_CHAIN} previousState={notificationSetting.stakingRewards ?? []} type='stakingReward' />
          : Popups.ACCOUNTS === popups &&
          <SelectAccounts onApply={onAccounts} onClose={closePopup} previousState={notificationSetting.accounts ?? []} />
      }
    </>
  );
}
