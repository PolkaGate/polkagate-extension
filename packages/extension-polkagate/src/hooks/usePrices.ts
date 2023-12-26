// Copyright 2019-2023 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useState } from 'react';

import { getPrices } from '../util/api/';
import { Prices } from '../util/types';
import useChainNames from './useChainNames';

/**
 * @description
 * get all referred chains token prices and save in local storage
 * @returns null: means not savedPrice found, happens when the first account is created
 */
export default function usePrices(): Prices | undefined | null {
  const chainNames = useChainNames() || [];

  const [savedPrice, setSavedPrice] = useState<Prices | null>();
  const [newPrices, setNewPrices] = useState<Prices | null>();

  useEffect(() => {
    async function fetchPrices () {
      try {
        const fetchedPrices = await getPrices(chainNames);

        setNewPrices(fetchedPrices);
      } catch (error) {
        console.error(error);
      }
    }

    if (chainNames.length) {
      fetchPrices().catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainNames.length]);

  useEffect(() => {
    if (newPrices) {
      chrome.storage.local.set({ prices: newPrices }).catch(console.error);
    }
  }, [newPrices]);

  useEffect(() => {
    chrome.storage.local.get('prices', (res) => {
      const localSavedPrices = res?.prices as Prices;

      if (localSavedPrices) {
        setSavedPrice(localSavedPrices);
      } else {
        setSavedPrice(null);
      }
    });
  }, []);

  return newPrices || savedPrice;
}
