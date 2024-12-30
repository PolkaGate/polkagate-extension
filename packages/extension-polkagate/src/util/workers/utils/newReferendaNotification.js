// Copyright 2019-2024 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NOTIFICATION_GOVERNANCE_CHAINS, NOTIFICATIONS_KEY, REFERENDA_COUNT_TO_TRACK_DOT, REFERENDA_COUNT_TO_TRACK_KSM, REFERENDA_STATUS } from '../../../popup/notification/constant';

// interface ReferendaDeposit {
//   who: string;
//   amount: number;
// }
// interface Referenda {
//   approved?: [number, null, null];
//   timedOut?: [number, ReferendaDeposit, null];
//   rejected?: [number, ReferendaDeposit, null];
//   cancelled?: [number, ReferendaDeposit, null];
//   ongoing?: {
//    submissionDeposit: ReferendaDeposit;
//    decisionDeposit: ReferendaDeposit | null;
//    deciding: boolean | null;
//  };
// }

const getRefStatus = (/** @type {{ [x: string]: any; }} */ item) => {
  for (const status of REFERENDA_STATUS) {
    if (item[status]) {
      return status;
    }
  }

  return 'ongoing';
};

/**
 * @param {import('@polkadot/api').ApiPromise} api
 * @param {string} chainName
 * @param {MessagePort} port
 */
export async function newRefNotif (api, chainName, port) {
  if (!NOTIFICATION_GOVERNANCE_CHAINS.includes(chainName)) {
    return undefined;
  }

  const isDot = chainName === 'polkadot';

  const latestRefId = Number((await api.query['referenda']['referendumCount']()).toPrimitive());

  const referendaInfoRequests = Array.from({ length: isDot ? REFERENDA_COUNT_TO_TRACK_DOT : REFERENDA_COUNT_TO_TRACK_KSM }, (_, index) =>
    api.query['referenda']['referendumInfoFor'](latestRefId - (index + 1)));

  const referendaInfo = await Promise.all(referendaInfoRequests);

  const info = referendaInfo.map((item, index) => {
    const status = getRefStatus(item);

    return {
      refId: latestRefId - index,
      status
    };
  });

  const message = {
    functionName: NOTIFICATIONS_KEY,
    message: {
      chainGenesis: api.genesisHash.toHex(),
      data: info,
      type: 'referenda'
    }
  };

  // console.log('message sent :', JSON.stringify(message));
  port.postMessage(JSON.stringify(message));
}
