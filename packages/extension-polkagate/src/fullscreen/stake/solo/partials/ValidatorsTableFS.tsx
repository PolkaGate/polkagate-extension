// Copyright 2019-2024 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable react/jsx-max-props-per-line */

import type { DeriveAccountInfo } from '@polkadot/api-derive/types';
import type { AccountId } from '@polkadot/types/interfaces';
import type { StakingConsts, ValidatorInfo } from '../../../../util/types';

import { alpha, Grid, type SxProps, type Theme, useTheme } from '@mui/material';
import React, { useCallback, useEffect, useRef, useState } from 'react';
// @ts-ignore
import { FixedSizeList as List } from 'react-window';

import { useInfo } from '@polkadot/extension-polkagate/src/hooks';
import ValidatorInfoPage from '@polkadot/extension-polkagate/src/popup/staking/partial/ValidatorInfo';
import { BN, hexToBn, isHex } from '@polkadot/util';

import { VaadinIcon } from '../../../../components';
import ShowValidator from './ShowValidator';

interface Props {
  activeValidators?: ValidatorInfo[] | undefined;
  allValidatorsIdentities?: DeriveAccountInfo[] | null | undefined;
  formatted?: AccountId | string;
  handleCheck?: (checked: React.ChangeEvent<HTMLInputElement>, validator: ValidatorInfo) => void;
  height?: number;
  isSelected?: (v: ValidatorInfo) => boolean;
  maxSelected?: boolean;
  style?: SxProps<Theme> | undefined;
  staked: BN | undefined;
  stakingConsts?: StakingConsts | null | undefined;
  showCheckbox?: boolean;
  validatorsToList: ValidatorInfo[] | null | undefined;
  address: string;
  nominatedValidatorsIds?: string[]| AccountId[] | null | undefined;
}

export default function ValidatorsTableFS ({ activeValidators, address, allValidatorsIdentities, formatted, handleCheck, height, isSelected, maxSelected, nominatedValidatorsIds, showCheckbox, staked, stakingConsts, style, validatorsToList }: Props): React.ReactElement {
  const theme = useTheme();
  const ref = useRef();
  const { api, chain, decimal, token } = useInfo(address);

  const [showValidatorInfo, setShowValidatorInfo] = useState<boolean>(false);
  const [validatorToShowInfo, setValidatorToShowInfo] = useState<ValidatorInfo>();

  const openValidatorInfo = useCallback((v: ValidatorInfo) => {
    setValidatorToShowInfo(v);
    setShowValidatorInfo(!showValidatorInfo);
  }, [showValidatorInfo]);

  const overSubscribed = useCallback((v: ValidatorInfo): { notSafe: boolean, safe: boolean } | undefined => {
    if (!stakingConsts) {
      return;
    }

    const threshold = stakingConsts.maxNominatorRewardedPerValidator;
    const sortedNominators = v.exposure?.others?.sort((a: any, b: any) => b.value - a.value);
    const maybeMyIndex = staked ? sortedNominators?.findIndex((n: any) => new BN(isHex(n.value) ? hexToBn(n.value) : String(n.value)).lt(staked)) : -1;

    return {
      notSafe: v.exposure?.others?.length > threshold && (maybeMyIndex > threshold || maybeMyIndex === -1),
      safe: v.exposure?.others?.length > threshold && (maybeMyIndex < threshold || maybeMyIndex === -1)
    };
  }, [staked, stakingConsts]);

  useEffect(() => {
    if (maxSelected && ref.current) {
      (ref.current as any).scrollTop = 0;
    }
  }, [maxSelected]);

  /** put active validators at the top of the list **/
  React.useMemo(() => {
    activeValidators?.forEach((av) => {
      const index = validatorsToList?.findIndex((v) => v.accountId === av?.accountId);

      if (validatorsToList && index && av && index !== -1) {
        validatorsToList.splice(index, 1);
        validatorsToList.unshift(av);
      }
    });
  }, [validatorsToList, activeValidators]);

  return (
    <Grid sx={{ ...style }}>
      <Grid container direction='column' sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'secondary.light', borderRadius: '5px', display: 'block', minHeight: '59px', scrollBehavior: 'smooth', textAlign: 'center' }}>
        {validatorsToList?.length && validatorsToList?.length !== 0 &&
          <List
            height={height}
            itemCount={validatorsToList?.length}
            itemSize={45}
            ref={ref}
            width={'100%'}
          >
            {({ index, key, style }: { index: number, key: number, style: any[] }) => {
              const v = validatorsToList[index];
              const isActive = !!activeValidators?.find((av) => v.accountId === av?.accountId);
              const isOversubscribed = overSubscribed(v);
              const accountInfo = allValidatorsIdentities?.find((a) => a.accountId === v?.accountId);
              const check = isSelected && isSelected(v);
              const isNominated = !!nominatedValidatorsIds?.find((n) => n === v.accountId);

              return (
                <Grid container item key={key} sx={{ backgroundColor: isNominated ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.4 : 0.2) : undefined, borderBottom: '1px solid', borderBottomColor: 'secondary.main', overflowY: 'scroll', ...style }}>
                  <ShowValidator
                    accountInfo={accountInfo}
                    api={api}
                    chain={chain}
                    check={check}
                    decimal={decimal}
                    handleCheck={handleCheck}
                    isActive={isActive}
                    isOversubscribed={isOversubscribed}
                    showCheckbox={showCheckbox}
                    stakingConsts={stakingConsts}
                    token={token}
                    v={v}
                  />
                  <Grid alignItems='center' container item justifyContent='center' onClick={() => openValidatorInfo(v)} sx={{ cursor: 'pointer' }} width='6%'>
                    <VaadinIcon icon='vaadin:ellipsis-dots-v' style={{ color: `${theme.palette.secondary.light}`, width: '33px' }} />
                  </Grid>
                </Grid>
              );
            }}
          </List>
        }
      </Grid>
      {showValidatorInfo && validatorToShowInfo && api && chain &&
        <ValidatorInfoPage
          api={api}
          chain={chain}
          isFullscreen
          setShowValidatorInfo={setShowValidatorInfo}
          showValidatorInfo={showValidatorInfo}
          staked={staked}
          stakerAddress={String(formatted)}
          validatorInfo={validatorToShowInfo}
          validatorsIdentities={allValidatorsIdentities}
        />
      }
    </Grid>
  );
}
