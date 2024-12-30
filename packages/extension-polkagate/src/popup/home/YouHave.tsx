// Copyright 2019-2024 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable react/jsx-max-props-per-line */

import type { YouHaveType } from '../../hooks/useYouHave';

import { MoreVert as MoreVertIcon } from '@mui/icons-material';
import { Box, Grid, IconButton, Stack, Typography, useTheme } from '@mui/material';
import React, { useCallback, useMemo, useState } from 'react';
import CountUp from 'react-countup';

import { stars5Black, stars5White } from '../../assets/icons';
import { logoBlack, logoWhite } from '../../assets/logos';
import { FormatPrice, Infotip2 } from '../../components';
import HideBalance from '../../components/SVG/HideBalance';
import Currency from '../../fullscreen/homeFullScreen/partials/Currency';
import { changeSign, PORTFOLIO_CHANGE_DECIMAL } from '../../fullscreen/homeFullScreen/partials/TotalBalancePieChart';
import { useCurrency, useIsHideNumbers, useYouHave } from '../../hooks';
import { PRICE_VALIDITY_PERIOD } from '../../hooks/usePrices';
import useTranslation from '../../hooks/useTranslation';
import ConnectedDappIcon from '../../partials/ConnectedDappIcon';
import Menu from '../../partials/Menu';
import { COIN_GECKO_PRICE_CHANGE_DURATION } from '../../util/api/getPrices';
import { countDecimalPlaces, fixFloatingPoint } from '../../util/utils';
import Notifications from '../notification/Notifications';

export const isPriceOutdated = (youHave: YouHaveType | null | undefined): boolean | undefined =>
  youHave ? (Date.now() - youHave.date > 2 * PRICE_VALIDITY_PERIOD) : undefined;

export default function YouHave (): React.ReactElement {
  const { t } = useTranslation();
  const theme = useTheme();
  const youHave = useYouHave();
  const currency = useCurrency();

  const isDark = theme.palette.mode === 'dark';
  const shadow = isDark
    ? '0px 0px 5px 2px rgba(255, 255, 255, 0.1)'
    : '0px 0px 10px rgba(0, 0, 0, 0.10)';

  const youHaveStyle = {
    '&::before': {
      background: isDark
        ? 'linear-gradient(to bottom right, rgba(255, 255, 255, 0.3), transparent)'
        : 'linear-gradient(to bottom right, rgba(66, 61, 61, 0.276), transparent)',
      content: '""',
      height: '100%',
      left: '-50%',
      pointerEvents: 'none',
      position: 'absolute',
      top: '-50%',
      transform: 'rotate(12deg)',
      width: '100%'
    },
    bgcolor: 'divider',
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: '10px',
    boxShadow: shadow,
    m: '20px 4% 10px',
    minHeight: '125px',
    overflow: 'hidden',
    position: 'relative',
    px: '10px',
    py: '10px',
    width: '100%'
  };

  const { isHideNumbers, toggleHideNumbers } = useIsHideNumbers();
  const [isMenuOpen, setOpenMenu] = useState(false);

  const portfolioChange = useMemo(() => {
    if (!youHave?.change) {
      return 0;
    }

    const value = fixFloatingPoint(youHave.change, PORTFOLIO_CHANGE_DECIMAL, false, true);

    return parseFloat(value);
  }, [youHave?.change]);

  const onMenuClick = useCallback(() => {
    setOpenMenu((open) => !open);
  }, []);

  return (
    <>
      <Grid alignItems='flex-start' container sx={{ ...youHaveStyle }}>
        <Grid alignItems='center' container item justifyContent='space-between'>
          <Typography sx={{ fontSize: '16px', fontVariant: 'small-caps', fontWeight: 400, lineHeight: 'normal', width: 'fit-content' }}>
            {t('Total balance')}
          </Typography>
          <Grid container item width='fit-content'>
            <HideBalance
              darkColor={theme.palette.secondary.light}
              hide={isHideNumbers}
              lightColor={theme.palette.secondary.light}
              onClick={toggleHideNumbers}
              size={20}
            />
            <Notifications />
            <Infotip2 placement='bottom' text={t('Menu options')}>
              <IconButton
                onClick={onMenuClick}
                sx={{ p: 0 }}
              >
                <MoreVertIcon sx={{ color: 'secondary.light', fontSize: '33px' }} />
              </IconButton>
            </Infotip2>
          </Grid>
        </Grid>
        <Grid container item justifyContent='flex-start' pt='5px'>
          {isHideNumbers
            ? <Box
              component='img'
              src={(theme.palette.mode === 'dark' ? stars5White : stars5Black) as string}
              sx={{ height: '20px', width: '130px' }}
            />
            : <>
              <Stack alignItems='center' direction='row' justifyContent='space-between' sx={{ flexWrap: 'wrap', mr: '15px', textAlign: 'start', width: '100%' }}>
                <Stack alignItems='flex-start' direction='row' sx={{ ml: '-5px' }}>
                  <Currency
                    color='secondary.light'
                    dialogLeft={60}
                    fontSize='25px'
                    height='27px'
                    minWidth='27px'
                  />
                  <Grid item sx={{ ml: '5px' }}>
                    <FormatPrice
                      fontSize='28px'
                      fontWeight={500}
                      num={youHave?.portfolio}
                      sign=' '
                      skeletonHeight={28}
                      textColor={isPriceOutdated(youHave) ? 'primary.light' : 'text.primary'}
                      width='100px'
                      withCountUp
                      withSmallDecimal
                    />
                  </Grid>
                </Stack>
                <Typography sx={{ color: !youHave?.change ? 'secondary.contrastText' : youHave.change > 0 ? 'success.contrastText' : 'warning.main', fontSize: '15px', fontWeight: 400 }}>
                  <CountUp
                    decimals={countDecimalPlaces(portfolioChange) || PORTFOLIO_CHANGE_DECIMAL}
                    duration={1}
                    end={portfolioChange}
                    prefix={`${changeSign(youHave?.change)}${currency?.sign}`}
                    suffix={`(${COIN_GECKO_PRICE_CHANGE_DURATION}h)`}
                  />
                </Typography>
              </Stack>
              <Stack alignItems='center' direction='row' spacing={1} sx={{ ml: '5px', mt: '5px', textAlign: 'start', width: '100%' }}>
                <FormatPrice
                  fontSize='14px'
                  fontWeight={400}
                  num={youHave?.available}
                  skeletonHeight={14}
                  textColor={'primary.light'}
                  width='100px'
                  withCountUp
                />
                <Typography sx={{ color: 'primary.light', fontSize: '14px', fontWeight: 400 }}>
                  {t('available')}
                </Typography>
              </Stack>
            </>
          }
        </Grid>
        <ConnectedDappIcon />
      </Grid>
      <Menu
        isMenuOpen={isMenuOpen}
        setShowMenu={setOpenMenu}
      />
      <Box
        alt='PolkaGate logo'
        component='img'
        src={theme.palette.mode === 'dark' ? logoBlack as string : logoWhite as string}
        sx={{ borderRadius: '30px', boxShadow: '0px 0px 5px 1px rgba(0,0,0,0.15)', height: 34, left: 'calc(50% - 17px)', position: 'absolute', top: '5px', width: 34 }}
      />
    </>
  );
}
