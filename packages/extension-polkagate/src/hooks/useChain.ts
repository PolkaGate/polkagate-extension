// Copyright 2019-2024 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useMemo, useState } from 'react';

import { Chain } from '@polkadot/extension-chains/types';
import { AccountId } from '@polkadot/types/interfaces/runtime';

import { getSubstrateAddress } from '../util/utils';
import { useAccount, useMetadata } from './';

export default function useChain (address: AccountId | string | undefined, chain?: Chain): Chain | null | undefined {
  /** address can be a formatted address hence needs to find its substrate format first */
  const sAddr = getSubstrateAddress(address);
  const account = useAccount(sAddr);
  const metaDataChain = useMetadata(account?.genesisHash, true);

  return useMemo(() => {
    if (chain) {
      return chain;
    } else if (account && !account?.genesisHash) {
      return null;
    } else {
      return metaDataChain;
    }
  }, [account, chain, metaDataChain]);
}
