// Copyright 2019-2024 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Chain } from '../../../extension-chains/src/types';

import { createWsEndpoints, externalLinks } from '@polkagate/apps-config';
import { createAssets } from '@polkagate/apps-config/assets';

import { toCamelCase } from '../fullscreen/governance/utils/util';
import getNetworkMap from './getNetworkMap';
import { sanitizeChainName } from './utils';

const endpoints = createWsEndpoints();

export interface LogoInfo {
  logo?: string | undefined;
  color?: string | undefined;
  subLogo?: string;
}

export default function getLogo2 (info: string | undefined | null | Chain, token?: string): LogoInfo | undefined {
  let chainNameFromGenesisHash;

  if (token) {
    const networkMap = getNetworkMap();

    chainNameFromGenesisHash = networkMap.get(info as string || '');

    if (!chainNameFromGenesisHash) {
      return undefined;
    }

    const assets = createAssets();

    const chainAssets = assets[toCamelCase(sanitizeChainName(chainNameFromGenesisHash) || '')];

    const found = chainAssets?.find(({ symbol }) => symbol === token)?.ui;

    if (found) {
      return { ...found, subLogo: found.subLogo ? getLogo2(chainNameFromGenesisHash)?.logo : undefined };
    }
  }

  let mayBeExternalLogo;
  const iconName = sanitizeChainName(chainNameFromGenesisHash || (info as Chain)?.name || (info as string))?.toLowerCase();

  const endpoint = endpoints.find(({ info, text }) => info?.toLowerCase() === iconName || (text as string)?.replace(/\s/g, '')?.toLowerCase() === iconName);

  if (!endpoint) {
    mayBeExternalLogo = Object
      .entries(externalLinks)
      .find(([name]): React.ReactNode | null =>
        name.toLowerCase() === iconName
      );
  }

  const found = iconName ? (endpoint?.ui || mayBeExternalLogo?.[1]?.ui) : undefined;

  return found;
}
