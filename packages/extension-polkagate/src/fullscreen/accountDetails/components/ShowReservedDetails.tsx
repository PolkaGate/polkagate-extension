// Copyright 2019-2024 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable react/jsx-max-props-per-line */

import type { PalletRecoveryRecoveryConfig, PalletReferendaReferendumInfoRankedCollectiveTally, PalletReferendaReferendumStatusRankedCollectiveTally } from '@polkadot/types/lookup';

import { ArrowBackIos as ArrowBackIosIcon } from '@mui/icons-material';
import { Grid, Typography, useTheme } from '@mui/material';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Progress } from '@polkadot/extension-polkagate/src/components';
import { useActiveRecoveries, useInfo, useTranslation } from '@polkadot/extension-polkagate/src/hooks';
import { PROXY_CHAINS } from '@polkadot/extension-polkagate/src/util/constants';
import { BN, BN_ZERO } from '@polkadot/util';

import { toTitleCase } from '../../governance/utils/util';
import { Proxy } from '../,,/../../../util/types';
import DisplayBalance from './DisplayBalance';

interface Props {
  address: string;
  setShowReservedDetails: React.Dispatch<React.SetStateAction<boolean>>

}

type Item = 'identity' | 'proxy';
type Reserved = { [key in Item]?: BN };

export default function ShowReservedDetails ({ address, setShowReservedDetails }: Props): React.ReactElement {
  const { t } = useTranslation();
  const theme = useTheme();

  const { api, decimal, formatted, genesisHash, token } = useInfo(address);
  const activeRecoveries = useActiveRecoveries(api);
  const [reserved, setReserved] = useState<Reserved>({});

  const activeLost = useMemo(() =>
    activeRecoveries && formatted
      ? activeRecoveries.filter((active) => active.lost === String(formatted)).at(-1) ?? null
      : activeRecoveries === null
        ? null
        : undefined
  , [activeRecoveries, formatted]);

  const onBackClick = useCallback(() => {
    setShowReservedDetails(false);
  }, [setShowReservedDetails]);

  useEffect(() => {
    if (!api || !genesisHash) {
      return;
    }

    const subAccountDeposit = api.consts.identity?.subAccountDeposit;

    // TODO: needs to incorporate people chain
    /** fetch identity reserved */
    api.query?.identity?.identityOf(formatted).then((id) => {
      const basicDeposit = api.consts.identity.basicDeposit;

      !id.isEmpty && setReserved((prev) => {
        prev.identity = basicDeposit as unknown as BN;

        return prev;
      });
    }).catch(console.error);

    /** fetch proxy reserved */
    if (api.query?.proxy && PROXY_CHAINS.includes(genesisHash)) {
      const proxyDepositBase = api.consts.proxy.proxyDepositBase as unknown as BN;
      const proxyDepositFactor = api.consts.proxy.proxyDepositFactor as unknown as BN;

      api.query.proxy.proxies(formatted).then((p) => {
        const fetchedProxies = JSON.parse(JSON.stringify(p[0])) as unknown as Proxy[];
        const proxyCount = fetchedProxies.length;

        if (proxyCount > 0) {
          setReserved((prev) => {
            prev.proxy = proxyDepositBase.add(proxyDepositFactor.muln(proxyCount));

            return prev;
          });
        }
      }).catch(console.error);
    }

    /** fetch social recovery reserved */
    api?.query?.recovery && api.query.recovery.recoverable(formatted).then((r) => {
      const recoveryInfo = r.isSome ? r.unwrap() as unknown as PalletRecoveryRecoveryConfig : null;

      recoveryInfo?.deposit && setReserved((prev) => {
        prev.recovery = (recoveryInfo.deposit as unknown as BN).add(activeLost?.deposit as unknown as BN || BN_ZERO);

        return prev;
      });
    }).catch(console.error);

    /** Fetch referenda reserved */
    if (api.query?.referenda?.referendumInfoFor) {
      let referendaDepositSum = BN_ZERO;

      api.query.referenda.referendumInfoFor.entries().then((referenda) => {
        referenda.forEach(([_, value]) => {
          if (value.isSome) {
            const ref = (value.unwrap()) as PalletReferendaReferendumInfoRankedCollectiveTally | undefined;

            if (!ref) {
              return;
            }

            const info = (ref.isCancelled
              ? ref.asCancelled
              : ref.isRejected
                ? ref.asRejected
                : ref.isOngoing
                  ? ref.asOngoing
                  : ref.isApproved ? ref.asApproved : undefined) as PalletReferendaReferendumStatusRankedCollectiveTally | undefined;

            if (info?.submissionDeposit && info.submissionDeposit.who.toString() === formatted) {
              referendaDepositSum = referendaDepositSum.add(info.submissionDeposit.amount);
            }

            if (info?.decisionDeposit?.isSome) {
              const decisionDeposit = info?.decisionDeposit.unwrap();

              if (decisionDeposit.who.toString() === formatted) {
                referendaDepositSum = referendaDepositSum.add(decisionDeposit.amount);
              }
            }
          }
        });

        if (!referendaDepositSum.isZero()) {
          setReserved((prev) => {
            prev.referenda = referendaDepositSum;

            return prev;
          });
        }
      }).catch(console.error);
    }
  }, [activeLost?.deposit, api, formatted, genesisHash]);

  return (
    <Grid alignItems='center' container item>
      <Grid alignItems='flex-start' container mb='10px'>
        <Grid item xs={0.3}>
          <ArrowBackIosIcon
            onClick={onBackClick}
            sx={{
              color: 'secondary.light',
              cursor: 'pointer',
              fontSize: 25,
              stroke: theme.palette.secondary.light,
              strokeWidth: 1
            }}
          />
        </Grid>
        <Grid item>
          <Typography fontSize='20px' fontWeight={500} ml='5px'>
            {t('Reserved details')}
          </Typography>
        </Grid>
      </Grid>
      {Object.entries(reserved)?.length
        ? <Grid container direction='column' item mb='10px' minWidth='735px' rowGap='10px'>
          {Object.entries(reserved)?.map(([key, value], index) => (
            <DisplayBalance
              amount={value}
              decimal={decimal}
              key={index}
              price={0}
              title={toTitleCase(key)}
              token={token}
            />
          ))
          }
        </Grid>
        : <Progress pt='40px' title={t('Loading information ...')} type='grid' />
      }
    </Grid>
  );
}
