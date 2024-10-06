// Copyright 2019-2024 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { DropdownOption } from '../util/types';

import { createWsEndpoints } from '@polkagate/apps-config';
import { useContext, useMemo } from 'react';

import { GenesisHashOptionsContext } from '../components';
import { useUserAddedEndpoint } from '../fullscreen/addNewChain/utils';
import { AUTO_MODE } from '../util/constants';
import { sanitizeChainName } from '../util/utils';

const supportedLC = ['Polkadot', 'Kusama', 'Westend']; // chains with supported light client
const allEndpoints = createWsEndpoints();

/**
 * @description
 * find endpoints based on chainName and also omit light client which my be add later
 */
export function useEndpoints (genesisHash: string | null | undefined): DropdownOption[] {
  const genesisOptions = useContext(GenesisHashOptionsContext);

  const userAddedEndpoint = useUserAddedEndpoint(genesisHash);

  const endpoints: DropdownOption[] | undefined = useMemo(() => {
    if (!genesisHash) {
      return [];
    }

    const option = genesisOptions?.find((o) => o.value === genesisHash);
    const chainName = sanitizeChainName(option?.text);

    if (!chainName) {
      return undefined;
    }

    const endpoints = allEndpoints?.filter((e) => e.value &&
      (String(e.info)?.toLowerCase() === chainName?.toLowerCase() ||
        String(e.text)?.toLowerCase()?.includes(chainName?.toLowerCase() ?? '') ||
        String(e.text)?.replace(/\s/g, '')?.toLowerCase() === chainName?.toLowerCase()
      )
    );

    if (!endpoints) {
      return undefined;
    }

    const hasLightClientSupport = supportedLC.includes(chainName);
    let endpointOptions = endpoints.map((endpoint) => ({ text: endpoint.textBy, value: endpoint.value }));

    if (!hasLightClientSupport) {
      endpointOptions = endpointOptions.filter((o) => String(o.value).startsWith('wss'));
    }

    endpointOptions.length > 1 &&
    endpointOptions?.unshift(AUTO_MODE);

    if (!endpointOptions?.length && userAddedEndpoint) {
      return userAddedEndpoint;
    }

    return endpointOptions;
  }, [genesisHash, genesisOptions, userAddedEndpoint]);

  return endpoints ?? [];
}
