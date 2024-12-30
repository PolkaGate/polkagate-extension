// Copyright 2019-2024 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable react/jsx-max-props-per-line */

import type { NotificationMessageType } from '../../hooks/useNotifications';

import { Box, Grid, Typography } from '@mui/material';
import React, { useCallback, useMemo } from 'react';

import { Identity, ShortAddress } from '../../components';
import { useTranslation } from '../../hooks';
import { NOT_READ_BGCOLOR, READ_BGCOLOR } from './constant';

interface Props {
  message: NotificationMessageType;
}

function NotificationItem ({ message }: Props) {
  const { t } = useTranslation();

  const sanitizeFloatAmount = useCallback((amount: string) => {
    const dotIndex = amount.indexOf('.');

    return dotIndex === -1
      ? amount
      : amount.slice(0, dotIndex + 3);
  }, []);

  const sanitizeBNAmount = useCallback((amount: string, decimal: number) => {
    const bnAmount = Number(amount);

    return isNaN(bnAmount)
      ? amount
      : (bnAmount / (10 ** decimal)).toString();
  }, []);

  const title = useMemo(() => {
    switch (message.type) {
      case 'receivedFund':
        return t('Received Fund');

      case 'referenda':
        return t('Referenda news on {{chainName}}', { replace: { chainName: message.chain?.text } });

      case 'stakingReward':
        return t('Staking reward on {{chainName}}', { replace: { chainName: message.chain?.text } });

      default:
        return t('Update');
    }
  }, [message, t]);

  const renderText = useMemo(() => {
    switch (message.type) {
      case 'receivedFund':
        return (
          <Grid container item pl='5px' rowGap='5px'>
            <Grid columnGap='10px' container item>
              <Typography fontSize='16px' fontWeight={400} width='fit-content'>
                {t('Account')}:
              </Typography>
              <Identity address={message.forAccount} identiconSize={20} showShortAddress style={{ fontSize: '16px', maxWidth: '200px' }} />
            </Grid>
            <Grid columnGap='10px' container item>
              <Typography fontSize='16px' fontWeight={400} width='fit-content'>
                {t('Amount')}:
              </Typography>
              <Typography fontSize='16px' fontWeight={400} width='fit-content'>
                {sanitizeFloatAmount(message.receivedFund?.amount ?? '')} {message.receivedFund?.assetSymbol}
              </Typography>
            </Grid>
            <Grid columnGap='10px' container item>
              <Typography fontSize='16px' fontWeight={400} width='fit-content'>
                {t('From')}:
              </Typography>
              <ShortAddress address={message.receivedFund?.from} charsCount={6} style={{ width: 'fit-content' }} />
              {/* <Identity formatted={message.receivedFund?.from} identiconSize={20} showShortAddress style={{ fontSize: '16px', maxWidth: '200px' }} /> */}
            </Grid>
            <Grid columnGap='10px' container item>
              <Typography fontSize='16px' fontWeight={400} width='fit-content'>
                {t('Date')}:
              </Typography>
              <Typography fontSize='16px' fontWeight={400} width='fit-content'>
                {message.receivedFund?.date}
              </Typography>
            </Grid>
          </Grid>
        );

      case 'referenda':
      {
        const status = message.referenda?.status ?? '';
        const refId = message.referenda?.refId ?? 0;
        let text = '';

        switch (status) {
          case 'ongoing':
            text = t('Referenda #{{refId}} is available for voting.', { replace: { refId } });
            break;

          case 'timedOut':
            text = t('Referenda #{{refId}} timed out.', { replace: { refId } });
            break;

          case 'approved':
            text = t('Referenda #{{refId}} has been approved.', { replace: { refId } });
            break;

          case 'rejected':
            text = t('Referenda #{{refId}} has been rejected.', { replace: { refId } });
            break;

          case 'cancelled':
            text = t('Referenda #{{refId}} has been cancelled.', { replace: { refId } });
            break;

          default:
            text = t('Referenda #{{refId}} status updated.', { replace: { refId } });
            break;
        }

        return (
          <Typography fontSize='16px' fontWeight={400}>
            {text}
          </Typography>
        );
      }

      case 'stakingReward':
        return (
          <Grid container item pl='5px' rowGap='5px'>
            <Grid columnGap='10px' container item>
              <Typography fontSize='16px' fontWeight={400}>
                {t('Account')}:
              </Typography>
              <Identity address={message.forAccount} identiconSize={20} showShortAddress style={{ fontSize: '16px', maxWidth: '200px' }} />
            </Grid>
            <Grid columnGap='10px' container item>
              <Typography fontSize='16px' fontWeight={400}>
                {t('Amount')}:
              </Typography>
              <Typography fontSize='16px' fontWeight={400}>
                {sanitizeFloatAmount(sanitizeBNAmount(message.payout?.amount ?? '', message.payout?.decimal ?? 0))}
              </Typography>
            </Grid>
            {/* <Grid item>
              <Typography fontSize='16px' fontWeight={400}>
                {t('From validator')}:
              </Typography>
              <Identity address={message.receivedFund?.from} identiconSize={20} />
            </Grid> */}
            <Grid columnGap='10px' container item>
              <Typography fontSize='16px' fontWeight={400}>
                {t('Date')}:
              </Typography>
              <Typography fontSize='16px' fontWeight={400}>
                {message.payout?.date}
              </Typography>
            </Grid>
          </Grid>
        );
    }
  }, [message.forAccount, message.payout?.amount, message.payout?.date, message.payout?.decimal, message.receivedFund?.amount, message.receivedFund?.assetSymbol, message.receivedFund?.date, message.receivedFund?.from, message.referenda?.refId, message.referenda?.status, message.type, sanitizeBNAmount, sanitizeFloatAmount, t]);

  return (
    <Grid container item sx={{ bgcolor: message.read ? READ_BGCOLOR : NOT_READ_BGCOLOR, borderRadius: '5px', p: '8px' }}>
      <Grid alignItems='center' container item>
        <Grid container item xs>
          <Typography fontSize='14px' fontWeight={500} py='3px' textAlign='left'>
            {title}
          </Typography>
        </Grid>
        <Box
          sx={{
            backgroundColor: message.read ? 'transparent' : 'primary.main',
            border: '1px solid',
            borderColor: 'primary.main',
            borderRadius: '50%',
            display: 'inline-block',
            height: '8px',
            marginRight: 1,
            mx: '10px',
            width: '8px'
          }}
        />
      </Grid>
      {renderText}
    </Grid>
  );
}

export default React.memo(NotificationItem);
