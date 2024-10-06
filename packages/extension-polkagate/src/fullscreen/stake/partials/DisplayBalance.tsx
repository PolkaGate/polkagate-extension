// Copyright 2019-2024 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable react/jsx-max-props-per-line */

import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import type { Balance } from '@polkadot/types/interfaces';
import type { BN } from '@polkadot/util';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ArrowForwardIosRounded as ArrowForwardIosRoundedIcon } from '@mui/icons-material';
import { Box, Collapse, Divider, Grid, Typography, useTheme } from '@mui/material';
import React, { useCallback, useMemo, useState } from 'react';

import { useTranslation } from '@polkadot/extension-polkagate/src/components/translate';
import { useInfo, useTokenPrice } from '@polkadot/extension-polkagate/src/hooks';
import { DATE_OPTIONS } from '@polkadot/extension-polkagate/src/util/constants';
import { noop } from '@polkadot/extension-polkagate/src/util/utils';

import { FormatPrice, ShowBalance } from '../../../components';

interface DisplayBalanceProps {
  address: string;
  amount: BN | Balance | undefined;
  title: string;
  onClicks?: (() => void)[];
  icons?: IconDefinition[];
  actions?: string[];
  isUnstaking?: boolean;
  toBeReleased?: {
    date: number;
    amount: BN;
  }[] | undefined;
  marginTop?: string;
}

interface ToBeReleasedType {
  showUnstaking: boolean;
  decimal: number | undefined;
  token: string | undefined;
  toBeReleased: { date: number; amount: BN; }[] | undefined;
  text: string;
}

const ToBeReleased = ({ decimal, showUnstaking, text, toBeReleased, token }: ToBeReleasedType) => (
  <Collapse in={showUnstaking} sx={{ width: '100%' }}>
    <Grid container sx={{ borderTop: '1px solid', borderTopColor: 'divider', fontSize: '16px', fontWeight: 500, ml: '7%', mt: '10px', width: '93%' }}>
      <Grid item pt='10px' xs={12}>
        {text}
      </Grid>
      {toBeReleased?.map(({ amount, date }) => (
        <Grid container item key={date} spacing='15px' sx={{ fontSize: '16px', fontWeight: 500 }}>
          <Grid fontWeight={300} item>
            {new Date(date).toLocaleDateString(undefined, DATE_OPTIONS)}
          </Grid>
          <Grid fontWeight={400} item>
            <ShowBalance balance={amount} decimal={decimal} token={token} />
          </Grid>
        </Grid>
      ))
      }
    </Grid>
  </Collapse>
);

export default function DisplayBalance ({ actions, address, amount, icons, isUnstaking, marginTop = '10px', onClicks, title, toBeReleased }: DisplayBalanceProps): React.ReactElement {
  const theme = useTheme();
  const { t } = useTranslation();
  const { price } = useTokenPrice(address, 0);

  const { api, decimal, token } = useInfo(address);
  const [showUnstaking, setShowUnstaking] = useState<boolean>(false);

  const isFastUnstakeAvailable = api?.tx?.['fastUnstake'];

  const triangleColor = useMemo(() => {
    switch (title) {
      case (t('Staked')):
        return theme.palette.aye.main;
      case (t('Redeemable')):
        return theme.palette.approval.main;
      case (t('Unstaking')):
        return theme.palette.support.main;
      case (t('Available to stake')):
        return theme.palette.warning.main;
      default:
        return undefined;
    }
  }, [t, theme, title]);

  const toggleShowUnstaking = useCallback(() => {
    toBeReleased?.length && setShowUnstaking(!showUnstaking);
  }, [showUnstaking, toBeReleased?.length]);

  return (
    <Grid alignItems='center' container item justifyContent='space-between' sx={{ bgcolor: 'background.paper', borderRadius: '5px', boxShadow: '2px 3px 4px 0px rgba(0, 0, 0, 0.1)', mt: { marginTop }, p: '5px 30px', position: 'relative' }}>
      <Grid alignItems='center' container item justifyContent='space-between' sx={{ minHeight: '67px' }}>
        <Typography fontSize='18px' fontWeight={400} width='28%'>
          {title}
        </Typography>
        <Grid alignItems='center' container item width='36%'>
          <Grid item sx={{ fontSize: '22px', fontWeight: 600 }}>
            <ShowBalance
              balance={amount}
              decimal={decimal}
              decimalPoint={3}
              token={token}
              withCurrency
            />
          </Grid>
          <Divider orientation='vertical' sx={{ backgroundColor: 'text.primary', height: '35px', mx: '10px', my: 'auto' }} />
          <FormatPrice
            amount={amount}
            decimals={decimal}
            fontSize= '22px'
            fontWeight= {400}
            price={price}
            skeletonHeight={20}
          />
        </Grid>
        <Grid container item justifyContent='flex-end' width='36%'>
          {isUnstaking &&
            <Grid alignItems='center' container direction='column' item justifyContent='center' minWidth='96px' sx={{ ml: '10px', width: 'fit-content' }}>
              <ArrowForwardIosRoundedIcon
                onClick={toggleShowUnstaking}
                sx={{
                  color: !toBeReleased?.length ? 'text.disabled' : 'secondary.light',
                  cursor: toBeReleased?.length ? 'pointer' : 'unset',
                  fontSize: '26px',
                  stroke: !toBeReleased?.length ? theme.palette.text.disabled : theme.palette.secondary.light,
                  strokeWidth: 1,
                  transform: toBeReleased?.length && showUnstaking ? 'rotate(-90deg)' : 'rotate(90deg)',
                  transitionDuration: '0.3s',
                  transitionProperty: 'transform'
                }}
              />
            </Grid>
          }
          {icons?.map((_, index) => {
            const noValueToAct = (!amount || amount?.isZero()) && actions && actions[index] !== t('pending');
            const isFastUnstakeToBeDisabled = !isFastUnstakeAvailable && actions?.[index] === t('fast unstake');

            const isDisabled = noValueToAct || isFastUnstakeToBeDisabled;

            return (actions &&
              <Grid alignItems='center' container direction='column' item justifyContent='center' key={index} minWidth='96px' onClick={isDisabled ? noop : onClicks && onClicks[index]} sx={{ cursor: isDisabled ? 'unset' : 'pointer', ml: '10px', width: 'fit-content' }}>
                <FontAwesomeIcon
                  color={`${isDisabled ? theme.palette.text.disabled : theme.palette.secondary.light}`}
                  icon={icons[index]}
                  style={{ height: '30px', marginBottom: '-4px', stroke: `${theme.palette.text.primary}`, strokeWidth: 5, width: '20px' }}
                />
                <Typography color={isDisabled ? theme.palette.text.disabled : theme.palette.secondary.light} fontSize='18px' fontWeight={400} textAlign='center'>
                  {actions[index]}
                </Typography>
              </Grid>
            );
          }
          )
          }
        </Grid>
      </Grid>
      {isUnstaking &&
        <ToBeReleased
          decimal={decimal}
          showUnstaking={showUnstaking}
          text={t('To be released')}
          toBeReleased={toBeReleased}
          token={token}
        />
      }
      {amount && !amount.isZero() &&
        <Box
          sx={{
            '&::before': {
              borderBottom: `20px solid ${triangleColor}`,
              borderBottomLeftRadius: '20%',
              borderRight: '20px solid transparent',
              bottom: 0,
              content: '""',
              height: 0,
              left: 0,
              position: 'absolute',
              width: 0
            },
            bottom: 0,
            left: 0,
            position: 'absolute'
          }}
        />}
    </Grid>
  );
}
