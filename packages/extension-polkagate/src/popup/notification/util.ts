// Copyright 2019-2024 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { NotificationMessageType, ReferendaNotificationType } from '../../hooks/useNotifications';
import type { DropdownOption } from '../../util/types';

import { selectableNetworks } from '@polkadot/networks';

import { postData } from '../../util/api';
import { getSubstrateAddress } from '../../util/utils';
import { BATCH_SIZE, MAX_RETRIES } from './constant';

interface ApiResponse<T> {
  code: number;
  message: string;
  generated_at: number;
  data: T;
}

interface Transfer {
  transfer_id: number;
  from: string;
  from_account_display: AccountDisplay;
  to: string;
  to_account_display: AccountDisplayWithMerkle;
  extrinsic_index: string;
  success: boolean;
  hash: string;
  block_num: number;
  block_timestamp: number;
  module: string;
  amount: string;
  amount_v2: string;
  current_currency_amount: string;
  currency_amount: string;
  fee: string;
  nonce: number;
  asset_symbol: string;
  asset_unique_id: string;
  asset_type: string;
  item_id: string | null;
  event_idx: number;
  is_lock: boolean;
}

interface Payout {
  era: number;
  stash: string;
  account: string;
  validator_stash: string;
  extrinsic_index: string;
  amount: string;
  block_timestamp: number;
  module_id: string;
  event_id: string;
}

interface AccountDisplay {
  address: string;
  people: Record<string, unknown>;
}

interface AccountDisplayWithMerkle extends AccountDisplay {
  merkle?: {
    address_type: string;
    tag_type: string;
    tag_subtype: string;
    tag_name: string;
  };
}

export interface TransfersProp {
  from: string,
  fromAccountDisplay: AccountDisplay,
  toAccountId: AccountDisplay,
  date: string,
  timestamp: number;
  amount: string,
  assetSymbol: string
}

export interface PayoutsProp {
  era: number;
  validatorStash: string;
  amount: string;
  date: string;
  decimal: number;
  timestamp: number;
}

export interface ReceivedFundInformation {
  address: string;
  data: TransfersProp[];
  network: DropdownOption;
}

export interface StakingRewardInformation {
  address: string;
  data: PayoutsProp[];
  network: DropdownOption;
}

export function timestampToDate (timestamp: number | string, format: 'full' | 'short' | 'relative' = 'full'): string {
  // Ensure timestamp is a number and convert if it's a string
  const timestampNum = Number(timestamp);

  // Check if timestamp is valid
  if (isNaN(timestampNum)) {
    return 'Invalid Timestamp';
  }

  // Create a Date object (multiply by 1000 if it's a Unix timestamp in seconds)
  const date = new Date(timestampNum * 1000);

  // Different formatting options
  switch (format) {
    case 'full':
      return date.toLocaleString('en-US', {
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        month: 'long',
        second: '2-digit'
      });

    case 'short':
      return date.toLocaleString('en-US', {
        day: 'numeric',
        month: 'short'
      });

    case 'relative':
      return getRelativeTime(date);

    default:
      return date.toLocaleString();
  }
}

// Helper function to get relative time
function getRelativeTime (date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const units = [
    { name: 'year', seconds: 31536000 },
    { name: 'month', seconds: 2592000 },
    { name: 'week', seconds: 604800 },
    { name: 'day', seconds: 86400 },
    { name: 'hour', seconds: 3600 },
    { name: 'minute', seconds: 60 }
  ];

  for (const unit of units) {
    const value = Math.floor(diffInSeconds / unit.seconds);

    if (value >= 1) {
      return value === 1
        ? `1 ${unit.name} ago`
        : `${value} ${unit.name}s ago`;
    }
  }

  return diffInSeconds <= 0 ? 'just now' : `${diffInSeconds} seconds ago`;
}

/**
 * Reorders the specified suffixes in a chain name:
 * - Moves the specified suffixes (if present) to the beginning of the text, separated by a hyphen.
 * - Removes "relay chain" and "network" from the chain name, as these are considered invalid suffixes.
 *
 * @param chainName - The original chain name to be modified.
 * @param [suffixes=['assethub']] - An array of suffixes to move and reorder, defaulting to ['assethub'].
 * @returns The modified chain name with the specified suffixes reordered.
 */
const formatChainName = (chainName: string | undefined, suffixes: string[] = ['asset hub']): string => {
  // Handle undefined input
  if (!chainName) {
    return '';
  }

  // Find and remove the invalid suffixes
  const sanitized = chainName.toLowerCase().replace(' relay chain', '').replace(' network', '');

  // Find the matching suffix
  const matchedSuffix = suffixes.find((suffix) => sanitized.endsWith(suffix));

  // Find and remove the suffix
  let baseName = sanitized;

  if (matchedSuffix) {
    baseName = sanitized.replace(matchedSuffix, ''); // remove from the end of the string
  }

  // Capitalize the first letter of each part
  const formattedParts = [
    baseName.replaceAll(' ', ''),
    matchedSuffix?.replaceAll(' ', '') ?? ''
  ].filter(Boolean);

  // Join the parts in reverse order
  return formattedParts.reverse().join('-');
};

const transformTransfers = (address: string, transfers: Transfer[], network: DropdownOption) => {
  // Initialize the accumulator for the reduce function
  const initialAccumulator = {
    address,
    data: [] as TransfersProp[],
    network
  };

  // Sanitize each transfer item and accumulate results
  const result = transfers.reduce((accumulator, transfer) => {
    if (getSubstrateAddress(transfer.to) !== address) {
      return accumulator;
    }

    const sanitizedTransfer = {
      amount: transfer.amount,
      assetSymbol: transfer.asset_symbol,
      date: timestampToDate(transfer.block_timestamp),
      from: transfer.from,
      fromAccountDisplay: transfer.from_account_display,
      timestamp: transfer.block_timestamp,
      // module: transfer.module,
      toAccountId: transfer.to_account_display
    };

    accumulator.data.push(sanitizedTransfer);

    return accumulator;
  }, initialAccumulator);

  return result;
};

const transformPayouts = (address: string, payouts: Payout[], network: DropdownOption) => {
  // Initialize the accumulator for the reduce function
  const initialAccumulator = {
    address,
    data: [] as PayoutsProp[],
    network
  };
  const decimal = selectableNetworks.find(({ genesisHash }) => (genesisHash[0] as unknown as string) === network.value)?.decimals[0];

  // Sanitize each transfer item and accumulate results
  const result = payouts.reduce((accumulator, payout) => {
    const sanitizedTransfer = {
      amount: payout.amount,
      date: timestampToDate(payout.block_timestamp),
      decimal,
      era: payout.era,
      timestamp: payout.block_timestamp,
      validatorStash: payout.validator_stash
    } as PayoutsProp;

    accumulator.data.push(sanitizedTransfer);

    return accumulator;
  }, initialAccumulator);

  return result;
};

/**
 * Fetches transfers information from subscan for the given addresses on the given chains
 * @param addresses - An array of addresses for which payout information fetch
 * @param chains - Name of the blockchain network
 * @returns Array of payouts information
 */
export const getReceivedFundsInformation = async (addresses: string[], chains: DropdownOption[]): Promise<ReceivedFundInformation[]> => {
  const results: ReceivedFundInformation[] = [];
  const networks = chains.map(({ text, value }) => ({ text: formatChainName(text), value }));

  // Process each address
  for (const address of addresses) {
    // Process network in batches of BATCH_SIZE
    for (let i = 0; i < networks.length; i += BATCH_SIZE) {
      // Take a batch of BATCH_SIZE networks (or remaining networks if less than BATCH_SIZE)
      const networkBatch = networks.slice(i, i + BATCH_SIZE);

      // Create promises for this batch of networks with retry mechanism
      const batchPromises = networkBatch.map(async (network) => {
        let lastError: unknown = null;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
          try {
            const receivedInfo = await postData(`https://${network.text}.api.subscan.io/api/v2/scan/transfers`, {
              address,
              row: 10
            }) as ApiResponse<{
              transfers: Transfer[] | null
            }>;

            if (receivedInfo.code !== 0) {
              throw new Error('Not a expected status code');
            }

            if (!receivedInfo.data.transfers) {
              return null; // account doesn't have any history
            }

            return transformTransfers(address, receivedInfo.data.transfers, network);
          } catch (error) {
            lastError = error;
            console.warn(`Attempt ${attempt} failed for ${network.text} and address ${address} (RECEIVED). Retrying...`);

            // Exponential backoff
            await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
          }
        }

        // If all retries fail, log the final error
        console.error(`(RECEIVED) Failed to fetch data for ${network.text} and address ${address} after ${MAX_RETRIES} attempts`, lastError);

        return null;
      });

      // Wait for all address requests in this batch
      const batchResults = await Promise.all(batchPromises);

      // Add non-null results to overall results
      results.push(...batchResults.filter((result) => result !== null));

      // console.log('results:', results);

      // If not the last batch, wait for 1 second
      if (i + BATCH_SIZE < addresses.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  return results;
};

/**
 * Fetches payouts information from subscan for the given addresses on the given chains
 * @param addresses - An array of addresses for which payout information fetch
 * @param chainNames - Name of the blockchain network
 * @returns Array of payouts information
 */
export const getPayoutsInformation = async (addresses: string[], chains: DropdownOption[]): Promise<StakingRewardInformation[]> => {
  const results: StakingRewardInformation[] = [];
  const networks = chains.map(({ text, value }) => ({ text: formatChainName(text), value }));

  // Process each address
  for (const address of addresses) {
    // Process networks in batches of BATCH_SIZE
    for (let i = 0; i < networks.length; i += BATCH_SIZE) {
      // Take a batch of BATCH_SIZE networks (or remaining networks if less than BATCH_SIZE)
      const networkBatch = networks.slice(i, i + BATCH_SIZE);

      // Create promises for this batch of networks with retry mechanism
      const batchPromises = networkBatch.map(async (network) => {
        let lastError: unknown = null;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
          try {
            const payoutInfo = await postData(`https://${network.text}.api.subscan.io/api/v2/scan/account/reward_slash`, {
              address,
              row: 10
            }) as ApiResponse<{
              list: Payout[]
            }>;

            if (payoutInfo.code !== 0) {
              throw new Error('Not a expected status code');
            }

            if (!payoutInfo.data.list) {
              return null; // account doesn't have any history
            }

            return transformPayouts(address, payoutInfo.data.list, network);
          } catch (error) {
            lastError = error;
            console.warn(`Attempt ${attempt} failed for ${network.text} and address ${address} (PAYOUT). Retrying...`);

            // Exponential backoff
            await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
          }
        }

        // If all retries fail, log the final error
        console.error(`(PAYOUT) Failed to fetch data for ${network.text} and address ${address} after ${MAX_RETRIES} attempts`, lastError);

        return null;
      });

      // Wait for all address requests in this batch
      const batchResults = await Promise.all(batchPromises);

      // Add non-null results to overall results
      results.push(...batchResults.filter((result) => result !== null));

      // console.log('results:', results);

      // If not the last batch, wait for 1 second
      if (i + BATCH_SIZE < addresses.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  return results;
};

/**
 * Generates notifications for new or updated referenda
 * @param chainName - Name of the blockchain network
 * @param previousReferenda - Previous state of referenda
 * @param currentReferenda - Current state of referenda
 * @returns Array of new notification messages
 */
export const generateReferendaNotifications = (
  chain: DropdownOption,
  previousReferenda: ReferendaNotificationType[] | null | undefined,
  currentReferenda: ReferendaNotificationType[]
): NotificationMessageType[] => {
  const newMessages: NotificationMessageType[] = [];

  // Find new referenda (not in previous state)
  const newReferenda = currentReferenda.filter(
    (current) => !previousReferenda?.some(
      (previous) => previous.refId === current.refId && previous.chainName === current.chainName
    )
  );

  // Find referenda with status changes
  const updatedReferenda = currentReferenda.filter(
    (current) => previousReferenda?.some(
      (previous) =>
        previous.refId === current.refId &&
        previous.chainName === current.chainName &&
        previous.status !== current.status
    )
  );

  // Generate notifications for new referenda
  newReferenda.forEach((referenda) => {
    newMessages.push({
      chain,
      read: false,
      referenda,
      type: 'referenda'
    });
  });

  // Generate notifications for referenda with status changes
  updatedReferenda.forEach((referenda) => {
    newMessages.push({
      chain,
      read: false,
      referenda,
      type: 'referenda'
    });
  });

  return newMessages;
};

/**
 * Generates notifications for new staking rewards
 * @param currentReferenda - Current state of referenda
 * @returns Array of new notification messages
 */
export const generateStakingRewardNotifications = (
  latestLoggedIn: number,
  payouts: StakingRewardInformation[]
): NotificationMessageType[] => {
  const newMessages: NotificationMessageType[] = [];
  const newPayouts = payouts.map(({ address, data, network }) => {
    const payout = data.find(({ timestamp }) => timestamp >= latestLoggedIn);

    return payout
      ? {
        address,
        network,
        payout
      }
      : undefined;
  }).filter((item) => !!item);

  // Generate notifications for new payouts
  newPayouts.forEach(({ address, network, payout }) => {
    newMessages.push({
      chain: network,
      forAccount: address,
      payout,
      read: false,
      type: 'stakingReward'
    });
  });

  return newMessages;
};

/**
 * Generates notifications for new staking rewards
 * @param currentReferenda - Current state of referenda
 * @returns Array of new notification messages
 */
export const generateReceivedFundNotifications = (
  latestLoggedIn: number,
  transfers: ReceivedFundInformation[]
): NotificationMessageType[] => {
  const newMessages: NotificationMessageType[] = [];
  const newReceivedFunds = transfers.map(({ address, data, network }) => {
    const receivedFund = data.find(({ timestamp }) => timestamp >= latestLoggedIn);

    return receivedFund
      ? {
        address,
        network,
        receivedFund
      }
      : undefined;
  }).filter((item) => !!item);

  // Generate notifications for new payouts
  newReceivedFunds.forEach(({ address, network, receivedFund }) => {
    newMessages.push({
      chain: network,
      forAccount: address,
      read: false,
      receivedFund,
      type: 'receivedFund'
    });
  });

  return newMessages;
};

/**
 * Marks messages as read
 * @param messages - Notification messages
 * @returns Array of new notification messages
 */
export const markMessagesAsRead = (messages: NotificationMessageType[]) => {
  return messages.map((message) => (
    {
      ...message,
      read: true
    }
  ));
};

export const updateReferendas = (preciousRefs: ReferendaNotificationType[] | null | undefined, newRefs: ReferendaNotificationType[], network: string) => {
  const filterOut = preciousRefs?.filter(({ chainName }) => chainName.toLowerCase() !== network.toLowerCase());

  return (filterOut ?? []).concat(newRefs);
};
