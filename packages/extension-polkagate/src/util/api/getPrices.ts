// Copyright 2019-2023 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

import request from 'umi-request';

import { Prices } from '../types';

export default async function getPrices(chainNames: string[], currency = 'usd'): Promise<Prices | null> {
  try {
    const replaceAssetHubs = chainNames.map((item) =>
      item.replace('westendassethub', 'westend').replace('kusamaassethub', 'kusama').replace('polkadotassethub', 'polkadot')
        .replace('westend asset hub', 'westend').replace('kusama asset hub', 'kusama').replace('polkadot asset hub', 'polkadot')
        .replace('westmint', 'westend').replace('statemine', 'kusama').replace('statemint', 'polkadot')
    );
    const nonDuplicateChainNames = [...new Set(replaceAssetHubs)];

    const prices = await getReq(`https://api.coingecko.com/api/v3/simple/price?ids=${nonDuplicateChainNames}&vs_currencies=${currency}`, {});

    if (chainNames.includes('pendulum')) {
      const pendulumPrice = await getReq(`https://min-api.cryptocompare.com/data/price?fsym=PEN&tsyms=USD`, {});

      if (pendulumPrice?.USD) {
        prices.pendulum = { usd: pendulumPrice.USD };
      }
    }

    prices.westend = { usd: 0 };
    prices.goreli = { usd: 0 };
    console.log('Prices:', prices);

    return { date: Date.now(), prices };
  } catch (e) {
    console.log('error while fetching prices:', e);

    return null;
  }
}

function getReq(api: string, data: Record<string, any> = {}, option?: Record<string, any>): Promise<Record<string, any>> {
  return request.get(api, {
    data,
    ...option
  });
}
