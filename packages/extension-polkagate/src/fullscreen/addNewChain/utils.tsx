// Copyright 2019-2024 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { HexString } from '@polkadot/util/types';
import type { DropdownOption, UserAddedEndpoint } from '../../util/types';

import { useContext, useMemo } from 'react';

import { UserAddedChainContext } from '../../components';

export function useUserAddedEndpoints (): Record<HexString, UserAddedEndpoint> | undefined {
  const userEndpoints = useContext(UserAddedChainContext);

  return userEndpoints;
}

export function UseUserAddedEndpoint (genesis: string | null | undefined): DropdownOption []| undefined {
  const endpoints = useUserAddedEndpoints();

  return useMemo(() => {
    if (!endpoints) {
      return;
    }

    const maybeEndpoint = Object.entries(endpoints).find(([genesisHash]) => genesis === genesisHash);

    return maybeEndpoint ? [{ text: 'endpoint', value: maybeEndpoint[1].endpoint }] : undefined;
  }, [endpoints, genesis]);
}

// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
export function UseUserAddedChainColor (_genesisHash: HexString | string | undefined): string | undefined {
  const endpoints = useUserAddedEndpoints();

  return useMemo(() => {
    if (!endpoints) {
      return;
    }

    return Object.entries(endpoints).find(([genesisHash]) => _genesisHash === genesisHash)?.[1].color;
  }, [_genesisHash, endpoints]);
}