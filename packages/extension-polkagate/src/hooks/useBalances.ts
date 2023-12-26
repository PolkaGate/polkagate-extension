// Copyright 2019-2023 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Balance } from '@polkadot/types/interfaces';
import type { PalletNominationPoolsPoolMember } from '@polkadot/types/lookup';

import { useCallback, useContext, useEffect, useState } from 'react';

import { BN, BN_ONE, BN_ZERO } from '@polkadot/util';

import { FetchingContext } from '../components';
import { getEthBalance, isEthereum } from '../eth/utils';
import { updateMeta } from '../messaging';
import getPoolAccounts from '../util/getPoolAccounts';
import { BalancesInfo, SavedBalances } from '../util/types';
import { useAccount, useApi, useChain, useChainName, useDecimal, useFormatted, useStakingAccount, useToken } from '.';

export default function useBalances(address: string | undefined, refresh?: boolean, setRefresh?: React.Dispatch<React.SetStateAction<boolean>>, onlyNew = false, assetId?: number): BalancesInfo | undefined {
  const stakingAccount = useStakingAccount(address);
  const account = useAccount(address);
  const api = useApi(address);
  const chain = useChain(address);
  const formatted = useFormatted(address);
  const isFetching = useContext(FetchingContext);
  const chainName = useChainName(address);
  const chainToken = useToken(address);
  const chainDecimal = useDecimal(address);

  const [pooledBalance, setPooledBalance] = useState<{ balance: BN, genesisHash: string } | null>();
  const [balances, setBalances] = useState<BalancesInfo | undefined>();
  const [overall, setOverall] = useState<BalancesInfo | undefined>();
  const [newBalances, setNewBalances] = useState<BalancesInfo | undefined>();
  const [assetBalance, setAssetBalance] = useState<BalancesInfo | undefined>();

  const apiToken = api && api.registry.chainTokens[0];
  const apiDecimal = api && api.registry.chainDecimals[0];

  const getPoolBalances = useCallback(() => {
    if (api && !api.query.nominationPools) {
      return setPooledBalance({ balance: BN_ZERO, genesisHash: api.genesisHash.toString() });
    }

    api && formatted && api.query.nominationPools.poolMembers(formatted).then(async (res) => {
      const member = res?.unwrapOr(undefined) as PalletNominationPoolsPoolMember | undefined;

      if (!member) {
        isFetching.fetching[String(formatted)].pooledBalance = false;
        isFetching.set(isFetching.fetching);

        return setPooledBalance({ balance: BN_ZERO, genesisHash: api.genesisHash.toString() }); // user does not joined a pool yet. or pool id does not exist
      }

      const poolId = member.poolId;
      const accounts = poolId && getPoolAccounts(api, poolId);

      if (!accounts) {
        console.log(`useBalances: can not find a pool with id: ${poolId}`);

        isFetching.fetching[String(formatted)].pooledBalance = false;
        isFetching.set(isFetching.fetching);

        return setPooledBalance({ balance: BN_ZERO, genesisHash: api.genesisHash.toString() });
      }

      const [bondedPool, stashIdAccount, myClaimable] = await Promise.all([
        api.query.nominationPools.bondedPools(poolId),
        api.derive.staking.account(accounts.stashId),
        api.call.nominationPoolsApi.pendingRewards(formatted)
      ]);

      const active = member.points.isZero()
        ? BN_ZERO
        : (new BN(String(member.points)).mul(new BN(String(stashIdAccount.stakingLedger.active)))).div(new BN(String(bondedPool.unwrap()?.points ?? BN_ONE)));
      const rewards = myClaimable as Balance;
      let unlockingValue = BN_ZERO;

      member?.unbondingEras?.forEach((value) => {
        unlockingValue = unlockingValue.add(value);
      });

      api.genesisHash.toString() === chain?.genesisHash && setPooledBalance({ balance: active.add(rewards).add(unlockingValue), genesisHash: api.genesisHash.toString() });
      setRefresh && setRefresh(false);
      isFetching.fetching[String(formatted)].pooledBalance = false;
      isFetching.set(isFetching.fetching);
    }).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, formatted, isFetching.fetching[String(formatted)]?.length, setRefresh]);

  const getBalances = useCallback(() => {
    if (!chainName || api?.genesisHash?.toString() !== chain?.genesisHash) {
      return;
    }

    api && formatted && api.derive.balances?.all(formatted).then((b) => {
      setNewBalances({ ...b, chainName, genesisHash: api.genesisHash.toString(), date: Date.now(), decimal: apiDecimal, token: apiToken });
      setRefresh && setRefresh(false);
      isFetching.fetching[String(formatted)].balances = false;
      isFetching.set(isFetching.fetching);
    }).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, chain?.genesisHash, chainName, formatted, isFetching.fetching[String(formatted)]?.length, setRefresh]);

  useEffect(() => {
    address && chainName && getEthBalance(address, chainName).then((balance) => {
      setBalances({
        accountId: address,
        chainName,
        decimal: chain?.tokenDecimals,
        token: chain?.tokenSymbol,
        date: Date.now(),
        genesisHash: chain?.genesisHash,
        ED: BN_ZERO,
        freeBalance: balance
      });

      console.log('balance:', balance);
    }).catch(console.error);
  }, [address, chain, chainName]);

  useEffect(() => {
    if (isEthereum(address)) {
      return;
    }

    if (newBalances && pooledBalance && api?.genesisHash?.toString() === chain?.genesisHash && api?.genesisHash?.toString() === newBalances?.genesisHash && api?.genesisHash?.toString() === pooledBalance.genesisHash) {
      setOverall({
        ...newBalances,
        pooledBalance: pooledBalance.balance,
        soloTotal: stakingAccount?.stakingLedger?.total
      });
    } else {
      setOverall(undefined);
    }
  }, [address, pooledBalance, newBalances, api?.genesisHash, account?.genesisHash, chain?.genesisHash, stakingAccount]);

  useEffect(() => {
    if (isEthereum(address) || !formatted || !apiToken || !apiDecimal || !chainName || api?.genesisHash?.toString() !== chain?.genesisHash) {
      return;
    }

    /** to fetch a formatted address's balance if not already fetching */
    if (!isFetching.fetching[String(formatted)]?.balances) {
      if (!isFetching.fetching[String(formatted)]) {
        isFetching.fetching[String(formatted)] = {};
      }

      isFetching.fetching[String(formatted)].balances = true;
      isFetching.set(isFetching.fetching);
      getBalances();
    } else {
      console.log(`Balance is fetching for ${formatted}, hence doesn't need to fetch it again!`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, api, chain?.genesisHash, chainName, apiDecimal, formatted, getBalances, isFetching.fetching[String(formatted)]?.length, apiToken]);

  useEffect(() => {
    if (isEthereum(address) || !chain?.genesisHash || !api || !formatted || api.genesisHash.toString() !== chain.genesisHash) {
      return;
    }

    if (!isFetching.fetching[String(formatted)]?.pooledBalance) {
      if (!isFetching.fetching[String(formatted)]) {
        isFetching.fetching[String(formatted)] = {};
      }

      isFetching.fetching[String(formatted)].pooledBalance = true;
      isFetching.set(isFetching.fetching);
      getPoolBalances();
    } else {
      console.log('pooled balance is fetching not need to fetch it again!');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, api, chain?.genesisHash, formatted, getPoolBalances, isFetching.fetching[String(formatted)]?.length]);

  useEffect(() => {
    if (isEthereum(address)) {
      return;
    }

    if (refresh) {
      setBalances(undefined);
      setNewBalances(undefined);
      setPooledBalance(undefined);

      if (isFetching.fetching[String(formatted)]) {
        isFetching.fetching[String(formatted)].pooledBalance = false;
        isFetching.fetching[String(formatted)].balances = true;
      }

      isFetching.set(isFetching.fetching);
      getBalances();
      getPoolBalances();
    }
  }, [address, Object.keys(isFetching?.fetching ?? {})?.length, api, chainName, apiDecimal, formatted, getBalances, getPoolBalances, refresh, apiToken]);

  useEffect(() => {
    if (isEthereum(address) || !address || !api || api.genesisHash.toString() !== account?.genesisHash || !overall || !chainName || !apiToken || !apiDecimal || account?.genesisHash !== chain?.genesisHash || account?.genesisHash !== overall.genesisHash) {
      return;
    }

    /** to SAVE fetched balance in local storage, first load saved balances of different chaines if any */
    const savedBalances = JSON.parse(account?.balances ?? '{}') as SavedBalances;

    const balances = {
      availableBalance: overall.availableBalance.toString(),
      freeBalance: overall.freeBalance.toString(),
      lockedBalance: overall.lockedBalance.toString(),
      pooledBalance: overall.pooledBalance.toString(),
      reservedBalance: overall.reservedBalance.toString(),
      vestedBalance: overall.vestedBalance.toString(),
      vestedClaimable: overall.vestedClaimable.toString(),
      votingBalance: overall.votingBalance.toString()
    };

    // add this chain balances
    savedBalances[chainName] = { balances, date: Date.now(), decimal: apiDecimal, token: apiToken };
    const metaData = JSON.stringify({ ['balances']: JSON.stringify(savedBalances) });

    updateMeta(address, metaData).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, api, Object.keys(account ?? {})?.length, account?.genesisHash, pooledBalance, chain, chainName, apiDecimal, overall, apiToken]);

  useEffect(() => {
    if (!isEthereum(address) || !balances || !chainName || !chainDecimal || !chainToken) {
      return;
    }

    const savedBalances = JSON.parse(account?.balances ?? '{}') as SavedBalances;
    const _balances = {
      freeBalance: balances.freeBalance.toString()
    };

    savedBalances[chainName] = { _balances, date: Date.now(), decimal: apiDecimal, token: apiToken };
    const metaData = JSON.stringify({ ['balances']: JSON.stringify(savedBalances) });

    updateMeta(address, metaData).catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?.length, address, chainName, apiDecimal, balances, apiToken]);

  useEffect(() => {
    if (isEthereum(address) || !chainName || !account || account?.genesisHash !== chain?.genesisHash) {
      return;
    }

    // to LOAD saved balances
    const savedBalances = JSON.parse(account?.balances ?? '{}') as SavedBalances;

    if (savedBalances[chainName]) {
      const sb = savedBalances[chainName].balances;

      const lastBalances = {
        availableBalance: new BN(sb.availableBalance),
        chainName,
        date: savedBalances[chainName].date,
        decimal: savedBalances[chainName].decimal,
        freeBalance: new BN(sb.freeBalance),
        lockedBalance: new BN(sb.lockedBalance),
        pooledBalance: new BN(sb.pooledBalance),
        reservedBalance: new BN(sb.reservedBalance),
        token: savedBalances[chainName].token,
        vestedBalance: new BN(sb.vestedBalance),
        vestedClaimable: new BN(sb.vestedClaimable),
        votingBalance: new BN(sb.votingBalance)
      };

      setBalances({ ...lastBalances, soloTotal: stakingAccount?.stakingLedger?.total });

      return;
    }

    setBalances(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Object.keys(account ?? {})?.length, address, chainName, stakingAccount]);

  useEffect(() => {
    if (isEthereum(address) || !api || assetId === undefined || !api?.query?.assets) {
      return;
    }

    // eslint-disable-next-line no-void
    void fetchAssetData();

    async function fetchAssetData() {
      if (!api) {
        return;
      }

      try {
        const [assetAccount, asset, metadata] = await Promise.all([
          api.query.assets.account(assetId, formatted),
          api.query.assets.asset(assetId),
          api.query.assets.metadata(assetId)
        ]);

        const ED = asset.isSome ? asset.unwrap()?.minBalance as BN : BN_ZERO;

        const assetBalances = {
          ED,
          availableBalance: assetAccount.isNone ? BN_ZERO : assetAccount.unwrap().balance as BN,
          chainName,
          decimal: metadata.decimals.toNumber() as number,
          freeBalance: assetAccount.isNone ? BN_ZERO : assetAccount.unwrap().balance as BN,
          genesisHash: api.genesisHash.toHex(),
          isAsset: true,
          reservedBalance: BN_ZERO,
          token: metadata.symbol.toHuman() as string
        };

        setAssetBalance(assetBalances);
      } catch (error) {
        console.error(`Failed to fetch info for assetId ${assetId}:`, error);
      }
    }
  }, [address, api, assetId, chainName, formatted]);

  if (assetId !== undefined) {
    return assetBalance;
  }

  if (onlyNew) {
    return newBalances; //  returns balances that have been fetched recently and are not from the local storage, and it does not include the pooledBalance
  }

  // return overall && overall.genesisHash === chain?.genesisHash ? overall : balances;
  return overall && overall.genesisHash === chain?.genesisHash && overall.token === chainToken && overall.decimal === chainDecimal
    ? overall
    : balances && balances.token === chainToken && balances.decimal === chainDecimal
      ? balances
      : undefined;
}
