// Copyright 2019-2024 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createWsEndpoints } from '@polkagate/apps-config';

/**
 * to get all available chain endpoints of a chain except light client
 * @param {string} chainName
 * @param {{ [s: string]: any; } | ArrayLike<any> | undefined} [userAddedEndpoints]
 */

export function getChainEndpoints (chainName, userAddedEndpoints) {
  const allEndpoints = createWsEndpoints();

  let endpoints = allEndpoints
    .filter((endpoint) =>
      endpoint.info &&
      (
        endpoint.info.toLowerCase() === chainName.toLowerCase() ||
        //@ts-ignore
        endpoint.text?.replace(/\s/g, '')?.toLowerCase() === chainName.toLowerCase()
      ) &&
      !endpoint.isDisabled && !endpoint?.isLightClient
    );

  if (!endpoints.length && userAddedEndpoints) {
    const maybeEndpoint = Object.entries(userAddedEndpoints).find(([_, { chain }]) => chain?.replace(/\s/g, '')?.toLowerCase() === chainName.toLowerCase());

    // @ts-ignore
    endpoints = maybeEndpoint ? [{ text: 'endpoint', value: maybeEndpoint[1].endpoint }] : [];
  }

  return endpoints;
}
