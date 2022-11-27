// Copyright 2019-2022 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { StakingConsts } from '../util/types';

import { useCallback, useEffect, useState } from 'react';

import { Chain } from '@polkadot/extension-chains/types';
import { BN } from '@polkadot/util';

import { updateMeta } from '../messaging';
import { prepareMetaData } from '../util/utils';
import { useChain, useEndpoint2 } from '.';

export default function useStakingConsts(address: string, stateConsts?: StakingConsts): StakingConsts | null | undefined {
  const [consts, setConsts] = useState<StakingConsts | undefined | null>();
  const endpoint = useEndpoint2(address);
  const chain = useChain(address);
  const chainName = chain?.name?.replace(' Relay Chain', '')?.replace(' Network', '');

  const getStakingConsts = useCallback((chain: Chain, endpoint: string) => {
    const getStakingConstsWorker: Worker = new Worker(new URL('../util/workers/getStakingConsts.js', import.meta.url));

    getStakingConstsWorker.postMessage({ endpoint });

    getStakingConstsWorker.onerror = (err) => {
      console.log(err);
    };

    getStakingConstsWorker.onmessage = (e: MessageEvent<any>) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const c: StakingConsts = e.data;

      if (c) {
        window.localStorage.setItem(`${chainName}_stakingConsts`, JSON.stringify(c));

        c.existentialDeposit = new BN(c.existentialDeposit);
        c.minNominatorBond = new BN(c.minNominatorBond);
        setConsts(c);
      } else {
        setConsts(null); // an issue while getting consts
      }

      getStakingConstsWorker.terminate();
    };
  }, [chainName]);

  useEffect(() => {
    if (stateConsts) {
      return setConsts(stateConsts);
    }

    const localSavedStakingConsts = chainName && window.localStorage.getItem(`${chainName}_stakingConsts`);

    if (localSavedStakingConsts) {
      const parsedConsts = JSON.parse(localSavedStakingConsts) as StakingConsts;

      parsedConsts.existentialDeposit = new BN(parsedConsts.existentialDeposit);
      parsedConsts.minNominatorBond = new BN(parsedConsts.minNominatorBond);

      setConsts(parsedConsts);
    }

    endpoint && chain && getStakingConsts(chain, endpoint);
  }, [endpoint, chain, getStakingConsts, stateConsts, chainName]);

  return consts;
}
