// Copyright 2019-2024 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

// @ts-nocheck
import getApi from '../getApi.ts';

const MAX_NOMINATIONS = {
  DOT: 16,
  KSM: 24,
  WND: 16,
  TZER: 1,
  AZERO: 1
};

const DEFAULT_MAX_NOMINATIONS = 16;

async function getStakingConsts (endpoint) {
  try {
    const api = await getApi(endpoint);
    const at = await api.rpc.chain.getFinalizedHead();
    const apiAt = await api.at(at);

    const token = api.registry.chainTokens[0];

    const maxNominations = MAX_NOMINATIONS?.[token] || DEFAULT_MAX_NOMINATIONS;
    const maxNominatorRewardedPerValidator = (apiAt.consts.staking.maxNominatorRewardedPerValidator || apiAt.consts.staking.maxExposurePageSize).toNumber();
    const existentialDeposit = apiAt.consts.balances.existentialDeposit.toString();
    const bondingDuration = apiAt.consts.staking.bondingDuration.toNumber();
    const sessionsPerEra = apiAt.consts.staking.sessionsPerEra.toNumber();
    const epochDuration = apiAt.consts.babe ? apiAt.consts.babe.epochDuration.toNumber() : 0;
    const expectedBlockTime = api.consts.babe ? api.consts.babe.expectedBlockTime.toNumber() : 0;
    const epochDurationInHours = epochDuration * expectedBlockTime / 3600000; // 1000 milSec * 60sec * 60min
    const [minNominatorBond, currentEraIndex] = await Promise.all([
      apiAt.query.staking.minNominatorBond(),
      api.query.staking.currentEra()
    ]);

    return {
      bondingDuration,
      eraIndex: Number(currentEraIndex?.toString(), '0'),
      existentialDeposit,
      maxNominations,
      maxNominatorRewardedPerValidator,
      minNominatorBond: minNominatorBond.toString(),
      token,
      unbondingDuration: bondingDuration * sessionsPerEra * epochDurationInHours / 24 // unbondingDuration in days
    };
  } catch (error) {
    console.log('something went wrong while getStakingConsts. err: ' + error);

    return null;
  }
}

onmessage = (e) => {
  const { endpoint } = e.data;

  getStakingConsts(endpoint)
    .then((consts) => {
      postMessage(consts);
    }).catch(console.error);
};
