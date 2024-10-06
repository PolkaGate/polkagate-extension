// Copyright 2019-2024 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

//@ts-nocheck
import type { DeriveAccountInfo } from '@polkadot/api-derive/types';
import type { PalletIdentityRegistration } from '@polkadot/types/lookup';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { hexToString } from '@polkadot/util';

import { useApiWithChain2, usePeopleChain } from '.';

interface SubIdentity {
  parentAddress: string,
  display: string
}

export default function useIdentity (genesisHash: string | undefined, formatted: string | undefined, accountInfo?: DeriveAccountInfo | null): DeriveAccountInfo | undefined | null {
  const [info, setInfo] = useState<DeriveAccountInfo | null>();

  const { peopleChain } = usePeopleChain(undefined, genesisHash);
  const api = useApiWithChain2(peopleChain);

  const getIdentityOf = useCallback(async (accountId: string) => {
    if (!api?.query?.['identity']?.['identityOf'] || !accountId) {
      return;
    }

    const i = await api.query['identity']['identityOf'](accountId) as any;
    const id = i.isSome ? i.unwrap()[0] || i.unwrap() as PalletIdentityRegistration : null;

    return id?.info
      ? {
        display: hexToString(id.info.display.asRaw.toHex()),
        email: hexToString(id.info.email.asRaw.toHex()),
        judgements: id.judgements,
        legal: hexToString(id.info.legal.asRaw.toHex()),
        riot: id.info.riot
          ? hexToString(id.info.riot.asRaw.toHex())
          : (id.info as any).matrix
            ? hexToString((id.info as any).matrix.asRaw.toHex())
            : '',
        // github: id.info.github && hexToString(id.info.github.asRaw.toHex()),
        twitter: hexToString(id.info.twitter.asRaw.toHex()),
        web: hexToString(id.info.web.asRaw.toHex())
      }
      : null;
  }, [api]);

  const getSubIdentityOf = useCallback(async (): Promise<SubIdentity | undefined> => {
    if (!api?.query?.['identity']?.['superOf'] || !formatted) {
      return;
    }

    const s = await api.query['identity']['superOf'](formatted) as any;
    const subId = s.isSome ? s.unwrap() : undefined;

    return subId
      ? {
        display: hexToString(subId[1].asRaw.toHex()),
        parentAddress: subId[0].toString() as string
      }
      : undefined;
  }, [api, formatted]);

  useEffect(() => {
    if (accountInfo && accountInfo.accountId?.toString() === formatted) {
      return setInfo(accountInfo);
    }

    api && formatted && getIdentityOf(formatted).then((identity) => {
      if (identity) {
        setInfo({
          accountId: api.createType('AccountId', formatted),
          identity
        });
      } else {
        // check if it has subId
        getSubIdentityOf().then((subId) => {
          if (subId) {
            getIdentityOf(subId.parentAddress).then((parentIdentity) => {
              if (parentIdentity) {
                const subIdentity = {
                  accountId: api.createType('AccountId', formatted),
                  identity: {
                    ...parentIdentity,
                    display: subId.display,
                    displayParent: parentIdentity.display
                  }
                };

                return setInfo(subIdentity);
              }
            }).catch(console.error);
          } else {
            setInfo(null);
          }
        }).catch(console.error);
      }
    }).catch(console.error);
  }, [accountInfo, api, formatted, getIdentityOf, getSubIdentityOf]);

  return useMemo(() => {
    if (accountInfo && accountInfo.accountId?.toString() === formatted) {
      return accountInfo;
    }

    return info;
  }, [accountInfo, formatted, info]);
}
