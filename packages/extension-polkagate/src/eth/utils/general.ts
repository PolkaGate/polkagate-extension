// Copyright 2019-2023 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ethers } from 'ethers';

export const isEthereum = (address?: string) => String(address)?.startsWith('0x');

const ethProvider = (chainName?: string): ethers.JsonRpcProvider => {
  if (chainName?.toLocaleLowerCase() === 'goreli') {
    return new ethers.JsonRpcProvider(process.env.INFURA_ETH_GORELI_ENDPOINT); // Replace with your Infura API key
  }

  return new ethers.JsonRpcProvider(process.env.INFURA_ETH_MAINNET_ENDPOINT); // Replace with your Infura API key
};

export const getEthBalance = async (address: string, chainName?: string): Promise<BN> => {
  const eth = ethProvider(chainName);
  const balance = await eth.getBalance(address);

 return balance;
};

export const formatEth = (balance: string): string => {
  return ethers.formatEther(balance);
};
