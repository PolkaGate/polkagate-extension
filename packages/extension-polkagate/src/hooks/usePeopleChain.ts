// Copyright 2019-2024 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Chain } from '@polkadot/extension-chains/types';

import { createWsEndpoints } from '@polkagate/apps-config';
import { useMemo } from 'react';

import { useUserAddedEndpoint } from '../fullscreen/addNewChain/utils';
import { KUSAMA_PEOPLE_GENESIS_HASH, PASEO_GENESIS_HASH, POLKADOT_PEOPLE_GENESIS_HASH, RELAY_CHAINS_NAMES, WESTEND_PEOPLE_GENESIS_HASH } from '../util/constants';
import getChain from '../util/getChain';
import { sanitizeChainName } from '../util/utils';
import { useInfo, useMetadata } from '.';

interface PeopleChainInfo {
  peopleChain: Chain | null | undefined;
  endpoint: string | undefined;
}
/**
 * @description To provide people chain if its already available for that chain
 * @param address
 * @param genesisHash
 * @returns endpoint and chain
 */

const getPeopleChainGenesisHash = (chainName: string | undefined) => {
  const startWith = RELAY_CHAINS_NAMES.find((name) => chainName?.startsWith(name)) || undefined;

  switch (startWith) {
    case 'Westend':
      return WESTEND_PEOPLE_GENESIS_HASH;
    case 'Kusama':
      return KUSAMA_PEOPLE_GENESIS_HASH;
    case 'Polkadot':
      return POLKADOT_PEOPLE_GENESIS_HASH;
    case 'Paseo':
      return PASEO_GENESIS_HASH;
    default:
      return undefined;
  }
};

const allEndpoints = createWsEndpoints();

export default function usePeopleChain (address: string | undefined, genesisHash?: string): PeopleChainInfo {
  const { chain } = useInfo(address);
  const userAddedEndpoint = useUserAddedEndpoint(genesisHash);

  const _chain = chain || getChain(genesisHash);
  const _chainName = sanitizeChainName(_chain?.name);

  const peopleChainGenesisHash = getPeopleChainGenesisHash(_chainName);

  const identityChain = useMetadata(peopleChainGenesisHash || genesisHash, true);

  const maybeEndpoint = useMemo(() => {
    const peopleChainName = sanitizeChainName(identityChain?.name);

    if (!peopleChainName) {
      return;
    }

    const endpoints = allEndpoints?.filter((e) => String(e.text)?.toLowerCase() === peopleChainName?.toLowerCase() || String(e.info)?.toLowerCase() === peopleChainName?.toLowerCase());

    if (!endpoints?.length && userAddedEndpoint) {
      return userAddedEndpoint[0].value as string;
    }

    return endpoints?.length ? endpoints[0].value : undefined;
  }, [identityChain?.name, userAddedEndpoint]);

  return {
    endpoint: maybeEndpoint,
    peopleChain: identityChain
  };
}
