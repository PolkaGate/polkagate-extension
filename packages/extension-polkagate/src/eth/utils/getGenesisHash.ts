// Copyright 2019-2023 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ethers } from 'ethers';

export async function getGenesisHash(): Promise<string> {
  const provider = new ethers.JsonRpcProvider(process.env.INFURA_ETH_MAINNET_ENDPOINT); // Replace with your Infura API key

  const block = await provider.getBlock(0);
  const genesisHash = ethers.hexlify(block.hash) as string;

  return genesisHash;
}