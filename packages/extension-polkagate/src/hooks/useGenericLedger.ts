// Copyright 2019-2024 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Network } from '@polkadot/networks/types';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { Ledger } from '@polkadot/hw-ledger';
import uiSettings from '@polkadot/ui-settings';
import { assert } from '@polkadot/util';

import ledgerChains from '../util/legerChains';
import useTranslation from './useTranslation';
import { GenericLedger } from '../util/ledger/genericLedger';
import type { PolkadotGenericApp } from '@zondax/ledger-substrate';

interface StateBase {
  isLedgerCapable: boolean;
  isLedgerEnabled: boolean;
}

interface State extends StateBase {
  address: string | null;
  error: string | null;
  isLoading: boolean;
  isLocked: boolean;
  ledger: GenericLedger | null;
  refresh: () => void;
  warning: string | null;
}

const POLKADOT_SLIP44 = 354;

function getNetwork(genesisHash: string): Network | undefined {
  return ledgerChains.find(({ genesisHash: [hash] }) => hash === genesisHash);
}

function getState(): StateBase {
  const isLedgerCapable = !!(window as unknown as { USB?: unknown }).USB;

  return {
    isLedgerCapable,
    isLedgerEnabled: isLedgerCapable && uiSettings.ledgerConn !== 'none'
  };
}

function retrieveLedger(): GenericLedger {
  let ledger: GenericLedger | null = null;

  const { isLedgerCapable } = getState();

  assert(isLedgerCapable, 'Incompatible browser, only Chrome is supported');

  assert(POLKADOT_SLIP44, 'There is no known Ledger app available for this chain');

  ledger = new GenericLedger('webusb', POLKADOT_SLIP44);

  return ledger;
}

export function useGenericLedger( accountIndex = 0, addressOffset = 0): State {
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [refreshLock, setRefreshLock] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);

  const ledger = useMemo(() => {
    setError(null);
    setIsLocked(false);
    setRefreshLock(false);

    try {
      return retrieveLedger();
    } catch (error) {
      setError((error as Error).message);
    }

    return null;
  }, [refreshLock]);

  useEffect(() => {
    if (!ledger) {
      setAddress(null);

      return;
    }

    setIsLoading(true);
    setError(null);
    setWarning(null);

    ledger.getAddress(false, accountIndex, addressOffset)
      .then((res) => {
        setIsLoading(false);
        setAddress(res.address);
      }).catch((e: Error) => {
        setIsLoading(false);

        const warningMessage = e.message.includes('Code: 26628')
          ? t('Is your ledger locked?')
          : null;

        const errorMessage = e.message.includes('App does not seem to be open')
          ? t('App does not seem to be open')
          : e.message;

        setIsLocked(true);
        setWarning(warningMessage);
        setError(t(
          'Ledger error: {{errorMessage}}',
          { replace: { errorMessage } }
        ));
        console.error(e);
        setAddress(null);
      });
    // If the dependency array is exhaustive, with t, the translation function, it
    // triggers a useless re-render when ledger device is connected.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountIndex, addressOffset, ledger]);

  const refresh = useCallback(() => {
    setRefreshLock(true);
    setError(null);
    setWarning(null);
  }, []);

  return ({ ...getState(), address, error, isLoading, isLocked, ledger, refresh, warning });
}