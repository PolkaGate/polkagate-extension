// Copyright 2019-2024 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable react/jsx-max-props-per-line */

import type { Balance } from '@polkadot/types/interfaces';
import type { BN } from '@polkadot/util';

import { Collapse, Divider, Grid, Skeleton, type SxProps, type Theme, Typography } from '@mui/material';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { useTranslation } from '@polkadot/extension-polkagate/src/components/translate';
import useReservedDetails, { type Reserved } from '@polkadot/extension-polkagate/src/hooks/useReservedDetails';
import { isOnRelayChain } from '@polkadot/extension-polkagate/src/util/utils';

import { ShowValue } from '../../../components';
import { useInfo } from '../../../hooks';
import { toTitleCase } from '../../governance/utils/util';
import DisplayBalance from './DisplayBalance';

interface Props {
  assetId: string | number | undefined,
  address: string | undefined;
  amount: BN | Balance | undefined;
  assetToken?: string | undefined;
  price: number | undefined;
  disabled?: boolean;
}

interface ReservedDetailsType {
  showReservedDetails: boolean;
  reservedDetails: Reserved;
}

interface WaitForReservedProps {
  rows?: number;
  skeletonHeight?: number;
  skeletonWidth?: number;
  style?: SxProps<Theme> | undefined;
}

function WaitForReserved ({ rows = 2, skeletonHeight = 20, skeletonWidth = 60, style }: WaitForReservedProps): React.ReactElement {
  return (
    <Grid container justifyContent='center' sx={{ ...style }}>
      {Array.from({ length: rows }).map((_, index) => (
        <Grid container key={index.toString()}>
          <Grid item xs={4}>
            <Skeleton
              animation='wave'
              height={skeletonHeight}
              sx={{ my: '5px', transform: 'none', width: `${skeletonWidth}%` }}
            />
          </Grid>
          <Grid item xs={4}>
            <Skeleton
              animation='wave'
              height={skeletonHeight}
              sx={{ my: '5px', transform: 'none', width: `${skeletonWidth}%` }}
            />
          </Grid>
        </Grid>
      ))}
    </Grid>
  );
}

const ReservedDetails = ({ reservedDetails, showReservedDetails }: ReservedDetailsType) => {
  const { t } = useTranslation();
  const [stillFetching, setStillFetching] = useState<boolean>(false);

  useEffect(() => {
    const reasons = Object.values(reservedDetails);

    const isStillFetchingSomething = reasons.some((reason) => reason === undefined);

    setStillFetching(isStillFetchingSomething);
  }, [reservedDetails]);

  const reasonsToShow = useMemo(() => {
    const reasons = Object.values(reservedDetails);

    // details are still fetching
    if (reasons.length === 0) {
      return undefined;
    }

    const noReason = reasons.every((reason) => reason === null);

    // no reasons found
    if (noReason) {
      return null;
    }

    // filter fetched reasons
    const filteredReservedDetails = Object.fromEntries(
      Object.entries(reservedDetails).filter(([_key, value]) => value && !value.isZero())
    );

    return Object.values(filteredReservedDetails).length > 0
      ? filteredReservedDetails
      : undefined;
  }, [reservedDetails]);

  return (
    <Collapse in={showReservedDetails} sx={{ width: '100%' }}>
      <Divider sx={{ bgcolor: 'divider', height: '1px', m: '3px auto', width: '90%' }} />
      <Grid container sx={{ float: 'right', fontSize: '16px', my: '10px', width: '85%' }}>
        <Typography fontSize='16px' fontWeight={500}>
          {t('Reasons')}
        </Typography>
        {reasonsToShow
          ? <Grid container direction='column' item>
            {Object.entries(reasonsToShow)?.map(([key, value], index) => (
              <Grid container item key={index} sx={{ fontSize: '16px' }}>
                <Grid item sx={{ fontWeight: 300 }} xs={4}>
                  {toTitleCase(key)}
                </Grid>
                <Grid fontWeight={400} item>
                  <ShowValue height={20} value={value?.toHuman()} />
                </Grid>
              </Grid>
            ))
            }
            {stillFetching && <WaitForReserved rows={1} />}
          </Grid>
          : reasonsToShow === null
            ? <Typography fontSize='16px' fontWeight={500} width='100%'>
              {t('No reasons found!')}
            </Typography>
            : <WaitForReserved rows={2} />
        }
      </Grid>
    </Collapse>
  );
};

function ReservedDisplayBalance ({ address, amount, assetId, assetToken, disabled, price }: Props): React.ReactElement {
  const { t } = useTranslation();
  const reservedDetails = useReservedDetails(address);
  const { decimal, genesisHash, token } = useInfo(address);

  const notOnNativeAsset = useMemo(() => (assetId !== undefined && Number(assetId) > 0) || assetToken?.toLowerCase() !== token?.toLowerCase(), [assetId, assetToken, token]);

  const [showReservedDetails, setShowReservedDetails] = useState<boolean>(false);

  useEffect(() => {
    setShowReservedDetails(false); // to reset collapsed area on chain change
  }, [address, genesisHash, assetId]);

  const toggleShowReservedDetails = useCallback(() => {
    reservedDetails && !amount?.isZero() && setShowReservedDetails(!showReservedDetails);
  }, [amount, reservedDetails, showReservedDetails]);

  return !genesisHash || notOnNativeAsset
    ? <></>
    : (
      <Grid container item sx={{ '> div': { bgcolor: 'unset', boxShadow: 'none' }, bgcolor: 'background.paper', borderRadius: '5px', boxShadow: '2px 3px 4px 0px rgba(0, 0, 0, 0.1)' }}>
        <DisplayBalance
          amount={amount}
          decimal={decimal}
          disabled={disabled}
          onClick={isOnRelayChain(genesisHash) || !notOnNativeAsset ? toggleShowReservedDetails : undefined}
          openCollapse={showReservedDetails}
          price={price}
          title={t('Reserved')}
          token={token}
        />
        <ReservedDetails
          reservedDetails={reservedDetails}
          showReservedDetails={showReservedDetails}
        />
      </Grid>
    );
}

export default React.memo(ReservedDisplayBalance);
