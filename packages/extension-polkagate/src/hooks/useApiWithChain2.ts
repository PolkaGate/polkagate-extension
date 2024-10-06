// Copyright 2019-2024 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ApiPromise } from '@polkadot/api';
import type { Chain } from '@polkadot/extension-chains/types';

import { createWsEndpoints } from '@polkagate/apps-config';
import { useMemo } from 'react';

import { useUserAddedEndpoint } from '../fullscreen/addNewChain/utils';
import getChainGenesisHash from '../util/getChainGenesisHash';
import { sanitizeChainName } from '../util/utils';
import useApi from './useApi';

const allEndpoints = createWsEndpoints();

export default function useApiWithChain2 (chain: Chain | null | undefined): ApiPromise | undefined {
  const genesisHash = useMemo(() => chain?.genesisHash || getChainGenesisHash(chain?.name), [chain]);
  const userAddedEndpoint = useUserAddedEndpoint(genesisHash);

  const maybeEndpoint = useMemo(() => {
    const chainName = sanitizeChainName(chain?.name);

    const endpoints = allEndpoints?.filter((e) =>
      String(e.text)?.toLowerCase() === chainName?.toLowerCase() ||
      String(e.info)?.toLowerCase() === chainName?.toLowerCase() ||
      String(e.text)?.replace(/\s/g, '')?.toLowerCase() === chainName?.toLowerCase()
    );

    if (!endpoints?.length && userAddedEndpoint) {
      return userAddedEndpoint[0].value as string;
    }

    return endpoints?.length ? endpoints[0].value : undefined;
  }, [chain?.name, userAddedEndpoint]);

  const _api = useApi(undefined, undefined, maybeEndpoint, genesisHash);

  return _api;
}
