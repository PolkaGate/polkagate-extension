// Copyright 2019-2023 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useState } from 'react';

import { Chain } from '@polkadot/extension-chains/types';
import { AccountId } from '@polkadot/types/interfaces/runtime';

import { getGenesisHash } from '../eth/utils/getGenesisHash';
import { getSubstrateAddress } from '../util/utils';
import { useAccount, useMetadata } from './';

const ethMainnetChain = {
  definition: {
    color: 'blue',
    // specVersion: number;
    tokenDecimals: 18,
    tokenSymbol: 'ETH',
    // types: Record<string, Record<string, string> | string>;
    // userExtensions?: ExtDef;
    chain: 'Ethereum',
    // genesisHash: string;
    // icon: string;
    // ss58Format: number;
    chainType: 'ethereum'
  },
  genesisHash: '0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3',
  hasMetadata: true,
  icon: 'Ethereum',
  isUnknown: true,
  name: 'Ethereum',
  // registry: Registry;
  // specVersion: number;
  // ss58Format: number;
  tokenDecimals: 18,
  tokenSymbol: 'ETH'
};

const ethChainGoreli = {
  ...ethMainnetChain,
  genesisHash: '0xbf7e331f7f7c1dd2e05159666b3bf8bc7a8a3a9eb1d518969eab529dd9b88c1a',
  name: 'Goreli'
};

export default function useChain(address: AccountId | string | undefined, chain?: Chain): Chain | null | undefined {
  /** address can be a formatted address hence needs to find its substrate format first */
  const sAddr = getSubstrateAddress(address);
  const account = useAccount(sAddr);
  const metaDataChain = useMetadata(account?.genesisHash, true);
  const [newChain, setNewChain] = useState<Chain | null | undefined>();

  useEffect(() => {
    if (chain) {
      setNewChain(chain);
    } else if (account?.type === 'ethereum') {
      setNewChain(ethChainGoreli);
    } else if (account && !account?.genesisHash) {
      setNewChain(null);
    } else {
      setNewChain(metaDataChain);
    }
  }, [account, chain, metaDataChain]);

  return newChain;
}
