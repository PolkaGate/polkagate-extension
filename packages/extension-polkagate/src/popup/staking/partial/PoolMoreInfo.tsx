// Copyright 2019-2024 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable react/jsx-max-props-per-line */

import { ArrowForwardIos as ArrowForwardIosIcon, Close as CloseIcon } from '@mui/icons-material';
import { Collapse, Grid, IconButton, Typography } from '@mui/material';
import { Circle } from 'better-react-spinkit';
import React, { useCallback, useMemo, useState } from 'react';
import { useParams } from 'react-router';

import { ApiPromise } from '@polkadot/api';
import type { Chain } from '@polkadot/extension-chains/types';

import { DraggableModal } from '@polkadot/extension-polkagate/src/fullscreen/governance/components/DraggableModal';
import useIsExtensionPopup from '@polkadot/extension-polkagate/src/hooks/useIsExtensionPopup';
import { BN, BN_ONE } from '@polkadot/util';

import { Identity, PButton, Progress, ShowBalance, SlidePopUp } from '../../../components';
import { useInfo, usePool, usePoolMembers, useTranslation } from '../../../hooks';
import type { FormattedAddressState, MemberPoints, MyPoolInfo, PoolInfo } from '../../../util/types';
import ClaimCommission from '../pool/claimCommission';
import ShowPool from './ShowPool';
import ShowRoles from './ShowRoles';

interface Props {
  address?: string;
  api: ApiPromise;
  chain: Chain;
  pool: MyPoolInfo | PoolInfo | undefined;
  poolId?: number;
  showPoolInfo: boolean;
  setShowPoolInfo: React.Dispatch<React.SetStateAction<boolean>>;
}

type TabTitles = 'Commission' | 'Ids' | 'Members' | 'Reward' | 'Roles' | 'None';
interface CollapseProps {
  mode: TabTitles;
  pool: MyPoolInfo;
  title: string;
  show: boolean;
  open: () => void;
}

export default function PoolMoreInfo({ api, chain, pool, poolId, setShowPoolInfo, showPoolInfo }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const isExtensionPopup = useIsExtensionPopup();

  const { address } = useParams<FormattedAddressState>();
  const { decimal, formatted, token } = useInfo(address);
  const poolToShow = usePool(address, poolId, false, pool);
  const poolMembers = usePoolMembers(api, poolToShow?.poolId?.toString());
  const poolPoints = useMemo(() => (poolToShow?.bondedPool ? new BN(String(poolToShow.bondedPool.points)) : BN_ONE), [poolToShow]);
  const [itemToShow, setShow] = useState<TabTitles>('None');
  const [showClaimCommission, setShowClaimCommission] = useState<boolean>();

  const membersToShow = useMemo(() => {
    if (!poolMembers) {
      return;
    }

    return poolMembers.map((m) => ({ accountId: m.accountId, points: m.member.points }) as MemberPoints);
  }, [poolMembers]);

  const _closeMenu = useCallback(
    () => setShowPoolInfo(false),
    [setShowPoolInfo]
  );

  const openTab = useCallback((tab: TabTitles) => () => {
    setShow(tab === itemToShow ? 'None' : tab);
  }, [itemToShow]);

  const toBalance = (points: BN) => {
    const staked = points ? api?.createType('Balance', points) : undefined;

    return staked;
  };

  const percent = useCallback((memberPoints: BN) => {
    return (Number(memberPoints.muln(100)) / Number(poolPoints.isZero() ? BN_ONE : poolPoints)).toFixed(2);
  }, [poolPoints]);

  const onClaimCommission = useCallback(() => {
    setShowClaimCommission(true);
  }, []);

  const ShowMembers = () => (
    <Grid container direction='column' display='block' sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'secondary.main', borderRadius: '5px', maxHeight: isExtensionPopup ? '130px' : '220px', minHeight: '80px', mt: '10px', overflowX: 'hidden', overflowY: 'scroll' }}>
      <Grid container item sx={{ borderBottom: '1px solid', borderBottomColor: 'secondary.light' }}>
        <Grid item width='50%'>
          <Typography fontSize='12px' fontWeight={300} lineHeight='30px' textAlign='center'>
            {t('Identity')}
          </Typography>
        </Grid>
        <Grid item sx={{ borderColor: 'secondary.light', borderInline: '1px solid' }} width='30%'>
          <Typography fontSize='12px' fontWeight={300} lineHeight='30px' textAlign='center'>
            {t('Staked')}
          </Typography>
        </Grid>
        <Grid item width='20%'>
          <Typography fontSize='12px' fontWeight={300} lineHeight='30px' textAlign='center'>
            {t('Percent')}
          </Typography>
        </Grid>
      </Grid>
      {membersToShow?.length
        ? membersToShow.map((member, index) => (
          <Grid container item key={index} sx={{ '&:last-child': { border: 'none' }, borderBottom: '1px solid', borderBottomColor: 'secondary.light' }}>
            <Identity address={member.accountId} api={api} chain={chain as any} formatted={member.accountId} identiconSize={25} showShortAddress style={{ fontSize: '14px', minHeight: '45px', pl: '10px', width: '50%' }} />
            <Grid alignItems='center' container fontSize='14px' fontWeight='400' item justifyContent='center' sx={{ borderColor: 'secondary.light', borderInline: '1px solid' }} width='30%'>
              <ShowBalance
                balance={toBalance(member.points)}
                decimal={decimal}
                decimalPoint={2}
                height={22}
                token={token}
              />
            </Grid>
            <Typography fontSize='14px' fontWeight='400' lineHeight='45px' textAlign='center' width='20%'>
              {percent(member.points)}%
            </Typography>
          </Grid>
        ))
        : <Grid alignItems='center' container justifyContent='center'>
          <Grid item>
            <Circle color='#99004F' scaleEnd={0.7} scaleStart={0.4} size={25} />
          </Grid>
          <Typography fontSize='13px' lineHeight='40px' pl='10px'>
            {t('Loading pool members...')}
          </Typography>
        </Grid>
      }
    </Grid>
  );

  const ShowReward = () => (
    <Grid container sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'secondary.main', borderRadius: '5px', my: '10px' }}>
      <Grid container item justifyContent='center' sx={{ borderBottom: '1px solid', borderBottomColor: 'secondary.main' }}>
        <Typography fontSize='12px' fontWeight={300} lineHeight='25px'>
          {t('Pool Claimable')}
        </Typography>
      </Grid>
      <Grid alignItems='center' container height='37px' item justifyContent='center'>
        <ShowBalance
          balance={poolToShow?.rewardClaimable?.toString()}
          decimal={decimal}
          decimalPoint={4}
          height={22}
          token={token}
        />
      </Grid>
    </Grid>
  );

  const ShowClaimableCommission = () => (
    <Grid container sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'secondary.main', borderRadius: '5px', my: '10px', pb: '5px' }}>
      <Grid container item justifyContent='center' sx={{ borderBottom: '1px solid', borderBottomColor: 'secondary.main' }}>
        <Typography fontSize='12px' fontWeight={300} lineHeight='25px'>
          {t('Claimable Commission')}
        </Typography>
      </Grid>
      <Grid alignItems='center' container height='37px' item justifyContent='center'>
        <ShowBalance
          balance={poolToShow?.rewardPool?.totalCommissionPending?.toString()}
          decimal={decimal}
          decimalPoint={4}
          height={22}
          token={token}
        />
      </Grid>
      <PButton
        _mt={2}
        _onClick={onClaimCommission}
        _variant='contained'
        /** We disabled claim commission in fullscreen */
        disabled={!isExtensionPopup || poolToShow?.rewardPool?.totalCommissionPending === 0 || poolToShow?.bondedPool?.roles?.root !== formatted}
        text={t('Claim')}
      />
    </Grid>
  );

  const CollapseData = ({ mode, open, pool, show, title }: CollapseProps) => (
    <Grid container direction='column' sx={{ m: 'auto', width: '92%' }}>
      <Grid container item justifyContent='space-between' onClick={open} sx={{ borderBottom: '1px solid', borderBottomColor: 'secondary.main', cursor: 'pointer' }}>
        <Typography fontSize='18px' fontWeight={400} lineHeight='40px'>
          {title}
        </Typography>
        <Grid alignItems='center' container item xs={1}>
          <ArrowForwardIosIcon sx={{ color: 'secondary.light', fontSize: 18, m: 'auto', stroke: '#BA2882', strokeWidth: '2px', transform: show ? 'rotate(-90deg)' : 'rotate(90deg)' }} />
        </Grid>
      </Grid>
      <Collapse in={show} sx={{ width: '100%' }}>
        {(mode === 'Ids' || mode === 'Roles') &&
          <ShowRoles api={api} chain={chain as any} mode={mode} pool={pool} style={{ my: '10px' }} />
        }
        {mode === 'Members' &&
          <ShowMembers />
        }
        {mode === 'Reward' &&
          <ShowReward />
        }
        {mode === 'Commission' &&
          <ShowClaimableCommission />
        }
      </Collapse>
    </Grid>
  );

  const page = (
    <Grid alignItems='flex-start' bgcolor='background.default' container display='block' item mt={isExtensionPopup ? '46px' : 0} sx={{ borderRadius: '10px 10px 0px 0px', height: 'parent.innerHeight' }} width='100%'>
      <Grid container justifyContent='center' my='20px'>
        <Typography fontSize='28px' fontWeight={400} lineHeight={1.4}>
          {t('Pool Info')}
        </Typography>
      </Grid>
      {poolToShow
        ? <Grid container direction='column' item rowGap='5px'>
          <ShowPool
            api={api}
            chain={chain as any}
            mode='Default'
            pool={poolToShow}
            style={{ m: '10px auto', width: '92%' }}
          />
          <CollapseData
            mode={itemToShow}
            open={openTab('Roles')}
            pool={poolToShow}
            show={itemToShow === 'Roles'}
            title={t('Roles')}
          />
          {poolToShow.accounts?.rewardId &&
            <CollapseData
              mode={itemToShow}
              open={openTab('Ids')}
              pool={poolToShow}
              show={itemToShow === 'Ids'}
              title={t('Ids')}
            />
          }
          {poolToShow.accounts?.rewardId &&
            <CollapseData
              mode={itemToShow}
              open={openTab('Members')}
              pool={poolToShow}
              show={itemToShow === 'Members'}
              title={t('Members')}
            />
          }
          {poolToShow.accounts?.rewardId &&
            <CollapseData
              mode={itemToShow}
              open={openTab('Reward')}
              pool={poolToShow}
              show={itemToShow === 'Reward'}
              title={t('Rewards')}
            />
          }
          {poolToShow.bondedPool?.roles && Object.values(poolToShow.bondedPool.roles).includes(formatted) &&
            <CollapseData
              mode={itemToShow}
              open={openTab('Commission')}
              pool={poolToShow}
              show={itemToShow === 'Commission'}
              title={t('Commission')}
            />
          }
          {showClaimCommission && poolToShow &&
            <ClaimCommission
              address={address}
              pool={poolToShow}
              setShow={setShowClaimCommission}
              show={showClaimCommission}
            />
          }
        </Grid>
        : <Progress pt='95px' size={125} title={t('Loading pool information...')} type='grid' />
      }
      <IconButton onClick={_closeMenu} sx={{ left: isExtensionPopup ? '15px' : undefined, p: 0, position: 'absolute', right: isExtensionPopup ? undefined : '30px', top: isExtensionPopup ? '65px' : '35px' }}>
        <CloseIcon sx={{ color: 'text.primary', fontSize: 35 }} />
      </IconButton>
    </Grid>
  );

  return (
    <>
      {isExtensionPopup
        ? <SlidePopUp show={showPoolInfo}>
          {page}
        </SlidePopUp>
        : <DraggableModal minHeight={650} onClose={_closeMenu} open={showPoolInfo}>
          {page}
        </DraggableModal>
      }
    </>
  );
}
