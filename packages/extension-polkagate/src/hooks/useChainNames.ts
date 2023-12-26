// Copyright 2019-2023 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useContext, useEffect, useState } from 'react';

import { AccountContext } from '../components';

export default function useChainNames(): string[] | undefined {
  const { hierarchy } = useContext(AccountContext);
  const [chainNames, setChainNames] = useState<string[]>();
  console.log('hierarchy', hierarchy)

  useEffect(() => {
    const chainsToFetchPrice = new Set<string>();

    hierarchy.forEach((h) => {
      if (h?.balances) {
        const parsed = JSON.parse(h.balances) as string[];

        Object.keys(parsed).forEach((key) => chainsToFetchPrice.add(key.toLocaleLowerCase()));
      }
    });

    setChainNames(chainsToFetchPrice.size ? Array.from(chainsToFetchPrice) : undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hierarchy]);

  return chainNames;
}
