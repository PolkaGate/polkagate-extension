// Copyright 2019-2024 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

import request from 'umi-request';

import { PricesType3 } from '../types';

export default async function getPrices3 (priceIds: string[], currencyCode = 'usd') {
  console.log(' getting prices3 for:', priceIds);

  const prices = await getReq(`https://api.coingecko.com/api/v3/simple/price?ids=${priceIds}&vs_currencies=${currencyCode}&include_24hr_change=true`, {});

  const outputObjectPrices: PricesType3 = {};

  for (const [key, value] of Object.entries(prices)) {
    outputObjectPrices[key] = { change: value[`${currencyCode}_24h_change`] as number, value: value[currencyCode] as number };
  }

  const price = { currencyCode, date: Date.now(), prices: outputObjectPrices };

  return price;
}

function getReq (api: string, data: Record<string, unknown> = {}, option?: Record<string, unknown>): Promise<Record<string, unknown>> {
  return request.get(api, {
    data,
    ...option
  });
}