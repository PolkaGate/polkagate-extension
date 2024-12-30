// Copyright 2019-2024 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ReferendaStatus } from '../popup/notification/constant';
import type { NotificationSettingType } from '../popup/notification/NotificationSettings';
import type { DropdownOption } from '../util/types';

import { useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';

import { AccountContext } from '../components';
import { getStorage, setStorage } from '../components/Loading';
import { DEFAULT_NOTIFICATION_SETTING, KUSAMA_NOTIFICATION_CHAIN, MAX_ACCOUNT_COUNT_NOTIFICATION, NOTIFICATION_SETTING_KEY, NOTIFICATIONS_KEY, SUBSCAN_SUPPORTED_CHAINS } from '../popup/notification/constant';
import { generateReceivedFundNotifications, generateReferendaNotifications, generateStakingRewardNotifications, getPayoutsInformation, getReceivedFundsInformation, markMessagesAsRead, type PayoutsProp, type ReceivedFundInformation, type StakingRewardInformation, type TransfersProp, updateReferendas } from '../popup/notification/util';
import { KUSAMA_GENESIS_HASH } from '../util/constants';
import { sanitizeChainName } from '../util/utils';
import { useWorker } from './useWorker';
import { useGenesisHashOptions, useSelectedChains } from '.';

interface WorkerMessage {
  functionName: string;
  message: {
    type: 'referenda';
    chainGenesis: string;
    data: { refId: number; status: ReferendaStatus; }[];
  }
}

export interface ReferendaNotificationType {
  status?: ReferendaStatus;
  refId?: number;
  chainName: string;
}

export interface NotificationMessageType {
  chain?: DropdownOption;
  type: 'referenda' | 'stakingReward' | 'receivedFund';
  payout?: PayoutsProp;
  referenda?: ReferendaNotificationType;
  receivedFund?: TransfersProp;
  forAccount?: string;
  extrinsicIndex?: string;
  read: boolean;
}

export interface NotificationsType {
  notificationMessages: NotificationMessageType[] | undefined;
  referendas: ReferendaNotificationType[] | null | undefined;
  receivedFunds: ReceivedFundInformation[] | null | undefined;
  stakingRewards: StakingRewardInformation[] | null | undefined;
  latestLoggedIn: number | undefined;
  isFirstTime: boolean | undefined;
}

type NotificationActionType =
  | { type: 'INITIALIZE'; }
  | { type: 'CHECK_FIRST_TIME'; }
  | { type: 'MARK_AS_READ'; }
  | { type: 'LOAD_FROM_STORAGE'; payload: NotificationsType }
  | { type: 'SET_REFERENDA'; payload: ReferendaNotificationType[] }
  | { type: 'SET_RECEIVED_FUNDS'; payload: NotificationsType['receivedFunds'] }
  | { type: 'SET_STAKING_REWARDS'; payload: NotificationsType['stakingRewards'] };

const initialNotificationState: NotificationsType = {
  isFirstTime: undefined,
  latestLoggedIn: undefined,
  notificationMessages: undefined,
  receivedFunds: undefined,
  referendas: undefined,
  stakingRewards: undefined
};

const notificationReducer = (
  state: NotificationsType,
  action: NotificationActionType
): NotificationsType => {
  switch (action.type) {
    case 'INITIALIZE':
      return {
        isFirstTime: true,
        latestLoggedIn: Math.floor(Date.now() / 1000), // timestamp must be in seconds not in milliseconds
        notificationMessages: [],
        receivedFunds: null,
        referendas: null,
        stakingRewards: null
      };

    case 'CHECK_FIRST_TIME':
      return { ...state, isFirstTime: true };

    case 'MARK_AS_READ':
      return { ...state, notificationMessages: markMessagesAsRead(state.notificationMessages ?? []) };

    case 'LOAD_FROM_STORAGE':
      return action.payload;

    case 'SET_REFERENDA': {
      const chainName = action.payload[0].chainName;
      const anyAvailableRefs = state.referendas?.find(({ chainName: network }) => network === chainName);

      return {
        ...state,
        isFirstTime: false,
        notificationMessages: anyAvailableRefs
          ? [...generateReferendaNotifications(KUSAMA_NOTIFICATION_CHAIN, state.referendas, action.payload), ...(state.notificationMessages ?? [])]
          : state.notificationMessages,
        referendas: updateReferendas(state.referendas, action.payload, chainName)
      };
    }

    case 'SET_RECEIVED_FUNDS':
      return {
        ...state,
        isFirstTime: false,
        notificationMessages: [...generateReceivedFundNotifications(state.latestLoggedIn ?? Math.floor(Date.now() / 1000), action.payload ?? []), ...(state.notificationMessages ?? [])],
        receivedFunds: action.payload
      };

    case 'SET_STAKING_REWARDS':
      return {
        ...state,
        isFirstTime: false,
        notificationMessages: [...generateStakingRewardNotifications(state.latestLoggedIn ?? Math.floor(Date.now() / 1000), action.payload ?? []), ...(state.notificationMessages ?? [])],
        stakingRewards: action.payload
      };

    default:
      return state;
  }
};

enum status {
  NONE,
  FETCHING,
  FETCHED
}

export default function useNotifications () {
  const worker = useWorker();
  const selectedChains = useSelectedChains();
  const allChains = useGenesisHashOptions(false);
  const { accounts } = useContext(AccountContext);

  const isGettingReceivedFundRef = useRef<status>(status.NONE); // Flag to avoid duplicate calls of getReceivedFundsInformation
  const isGettingPayoutsRef = useRef<status>(status.NONE); // Flag to avoid duplicate calls of getPayoutsInformation
  const initializedRef = useRef<boolean>(false); // Flag to avoid duplicate initialization
  const isSavingRef = useRef<boolean>(false); // Flag to avoid duplicate save in the storage

  const chains = useMemo(() => {
    if (!selectedChains) {
      return undefined;
    }

    return allChains
      .filter(({ value }) => selectedChains.includes(value as string))
      .map(({ text, value }) => ({ text, value } as DropdownOption));
  }, [allChains, selectedChains]);

  const [settings, setSettings] = useState<NotificationSettingType | undefined>();
  const [defaultSettingFlag, setDefaultSettingFlag] = useState<boolean>(false);
  const [notifications, dispatchNotifications] = useReducer(notificationReducer, initialNotificationState);

  const notificationIsOff = useMemo(() => !settings || settings.enable === false || settings.accounts?.length === 0, [settings]);

  const markAsRead = useCallback(() => {
    dispatchNotifications({ type: 'MARK_AS_READ' });
  }, []);

  const receivedFunds = useCallback(async () => {
    if (chains && isGettingReceivedFundRef.current === status.NONE && settings?.accounts && settings.receivedFunds) {
      isGettingReceivedFundRef.current = status.FETCHING;

      const filteredSupportedChains = chains.filter(({ text }) => {
        const sanitized = sanitizeChainName(text)?.toLowerCase();

        if (!sanitized) {
          return false;
        }

        return SUBSCAN_SUPPORTED_CHAINS.find((chainName) => chainName.toLowerCase() === sanitized);
      });

      const receivedFunds = await getReceivedFundsInformation(settings.accounts, filteredSupportedChains);

      isGettingReceivedFundRef.current = status.FETCHED;
      dispatchNotifications({
        payload: receivedFunds,
        type: 'SET_RECEIVED_FUNDS'
      });
    }
  }, [chains, settings?.accounts, settings?.receivedFunds]);

  const payoutsInfo = useCallback(async () => {
    if (isGettingPayoutsRef.current === status.NONE && isGettingReceivedFundRef.current !== status.FETCHING && settings?.accounts && settings.stakingRewards && settings.stakingRewards.length !== 0) {
      isGettingPayoutsRef.current = status.FETCHING;

      const payouts = await getPayoutsInformation(settings.accounts, settings.stakingRewards);

      isGettingPayoutsRef.current = status.FETCHED;
      dispatchNotifications({
        payload: payouts,
        type: 'SET_STAKING_REWARDS'
      });
    }
  }, [settings?.accounts, settings?.stakingRewards]);

  useEffect(() => {
    const getSettings = async () => {
      const savedSettings = await getStorage(NOTIFICATION_SETTING_KEY) as NotificationSettingType;

      if (!savedSettings) {
        setDefaultSettingFlag(true);

        return;
      }

      setSettings(savedSettings);
    };

    getSettings().catch(console.error);
  }, []);

  useEffect(() => {
    if (!defaultSettingFlag) {
      return;
    }

    const addresses = accounts.map(({ address }) => address).slice(0, MAX_ACCOUNT_COUNT_NOTIFICATION);

    setSettings({
      ...DEFAULT_NOTIFICATION_SETTING, // accounts is an empty array in the constant file
      accounts: addresses
    });
  }, [accounts, defaultSettingFlag]);

  useEffect(() => {
    if (notificationIsOff || !settings || initializedRef.current) {
      return;
    }

    const loadSavedNotifications = async () => {
      initializedRef.current = true;

      try {
        const savedNotifications = await getStorage(NOTIFICATIONS_KEY) as NotificationsType | undefined;

        savedNotifications
          ? dispatchNotifications({ payload: savedNotifications, type: 'LOAD_FROM_STORAGE' })
          : dispatchNotifications({ type: 'INITIALIZE' }); // will happen only for the first time
      } catch (error) {
        console.error('Failed to load saved notifications:', error);
      }
    };

    loadSavedNotifications().catch(console.error);
  }, [notificationIsOff, settings]);

  useEffect(() => {
    if (notificationIsOff || settings?.governance?.length === 0) {
      return;
    }

    const handelMessage = (event: MessageEvent<string>) => {
      try {
        if (!event.data) {
          return;
        }

        const parsedMessage = JSON.parse(event.data) as WorkerMessage;

        if (parsedMessage.functionName !== NOTIFICATIONS_KEY) {
          return;
        }

        const { message } = parsedMessage;

        if (message.type !== 'referenda') {
          return;
        }

        const { chainGenesis, data } = message;

        if (settings?.governance?.find(({ value }) => value === chainGenesis)) {
          const chainName = chainGenesis === KUSAMA_GENESIS_HASH ? 'kusama' : 'polkadot';
          const payload = data.map((item) => ({ ...item, chainName }));

          dispatchNotifications({
            payload,
            type: 'SET_REFERENDA'
          });
        }
      } catch (error) {
        console.error('Error processing worker message:', error);
      }
    };

    worker.addEventListener('message', handelMessage);

    return () => {
      worker.removeEventListener('message', handelMessage);
    };
  }, [notificationIsOff, settings?.governance, worker]);

  useEffect(() => {
    if (notificationIsOff || !settings) {
      return;
    }

    if (settings.receivedFunds) {
      receivedFunds().catch(console.error);
    } else {
      isGettingReceivedFundRef.current = status.FETCHED;
    }

    if (settings.stakingRewards?.length !== 0) {
      payoutsInfo().catch(console.error);
    }
  }, [notificationIsOff, payoutsInfo, receivedFunds, settings]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      const notificationIsInitializing = notifications.isFirstTime && notifications.referendas?.length === 0;

      if (!isSavingRef.current && !notificationIsInitializing) {
        isSavingRef.current = true;

        const dataToSave = notifications;

        dataToSave.latestLoggedIn = Math.floor(Date.now() / 1000); // timestamp must be in seconds not in milliseconds

        setStorage(NOTIFICATIONS_KEY, dataToSave)
          .then(() => {
            console.log('Notifications saved successfully on unload.');
          })
          .catch((error) => {
            console.error('Failed to save notifications on unload:', error);
          });
      }
    };

    // Add event listener for the 'beforeunload' event
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [notifications]);

  return {
    markAsRead,
    notifications
  };
}
