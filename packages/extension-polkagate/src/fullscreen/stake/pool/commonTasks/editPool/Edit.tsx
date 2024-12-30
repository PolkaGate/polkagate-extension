// Copyright 2019-2024 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable react/jsx-max-props-per-line */

import type { ApiPromise } from '@polkadot/api';
import type { Chain } from '@polkadot/extension-chains/types';
import type { Option } from '@polkadot/types';
import type { Perbill } from '@polkadot/types/interfaces';
import type { MyPoolInfo } from '../../../../../util/types';
import type { ChangesProps } from '.';

import { Grid, Typography, useTheme } from '@mui/material';
import React, { useCallback, useContext, useEffect, useState } from 'react';

import CollapseIt from '@polkadot/extension-polkagate/src/popup/staking/pool/myPool/editPool/CollapseIt';
import getAllAddresses from '@polkadot/extension-polkagate/src/util/getAllAddresses';

import { AccountContext, AddressInput, AutoResizeTextarea, ButtonWithCancel, Input, ShowValue } from '../../../../../components';
import { useTranslation } from '../../../../../hooks';
import { STEPS } from '../../stake';

interface Props {
  api: ApiPromise | undefined;
  chain: Chain | null | undefined;
  pool: MyPoolInfo;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  onClose: () => void;
  setChanges: React.Dispatch<React.SetStateAction<ChangesProps | undefined>>;
  changes: ChangesProps | undefined;
}

function Edit ({ api, chain, changes, onClose, pool, setChanges, setStep }: Props): React.ReactElement {
  const { t } = useTranslation();
  const theme = useTheme();
  const { hierarchy } = useContext(AccountContext);

  const poolName = pool?.metadata;
  const poolRoles = pool?.bondedPool?.roles;
  const depositorAddress = pool?.bondedPool?.roles?.depositor?.toString();
  //@ts-ignore
  const maybeCommissionPayee = pool?.bondedPool?.commission?.current?.[1]?.toString() as string | undefined;
  //@ts-ignore
  const maybeCommission = (pool?.bondedPool?.commission?.current?.[0] || 0) as number;
  const commissionValue = Number(maybeCommission) / (10 ** 7) < 1 ? 0 : Number(maybeCommission) / (10 ** 7);

  const [newPoolName, setNewPoolName] = useState<string>();
  const [newRootAddress, setNewRootAddress] = useState<string | null | undefined>();
  const [newNominatorAddress, setNewNominatorAddress] = useState<string | null | undefined>();
  const [newBouncerAddress, setNewBouncerAddress] = useState<string | null | undefined>();
  const [collapsedName, setCollapsed] = useState<string | undefined>();
  const [newCommissionPayee, setNewCommissionPayee] = useState<string | null | undefined>();
  const [newCommissionValue, setNewCommissionValue] = useState<number | undefined>();
  const [maxCommission, setMaxCommission] = useState<Perbill | undefined>();

  const open = useCallback((title: string) => {
    setCollapsed(title === collapsedName ? undefined : title);
  }, [collapsedName]);

  const allAddresses = getAllAddresses(hierarchy, false, true, chain?.ss58Format);

  useEffect(() => { // maybe it is better to use "useLayoutEffect"
    !newPoolName && poolName && setNewPoolName(poolName);
    !newRootAddress && pool?.bondedPool?.roles && setNewRootAddress(pool?.bondedPool?.roles.root?.toString());
    !newNominatorAddress && pool?.bondedPool?.roles && setNewNominatorAddress(pool?.bondedPool?.roles.nominator?.toString());
    !newBouncerAddress && pool?.bondedPool?.roles && setNewBouncerAddress(pool?.bondedPool?.roles.bouncer?.toString());

    !newCommissionPayee && maybeCommissionPayee && setNewCommissionPayee(maybeCommissionPayee);
    !newCommissionPayee && commissionValue && setNewCommissionValue(commissionValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);// needs to be run only once to initialize

  useEffect(() => {
    setChanges({
      commission: {
        payee: getChangedValue(newCommissionPayee, maybeCommissionPayee) as string,
        value: (newCommissionPayee || maybeCommissionPayee) ? getChangedValue(newCommissionValue, commissionValue) as number : undefined
      },
      newPoolName: getChangedValue(newPoolName, poolName) as string,
      newRoles: {
        newBouncer: getChangedValue(newBouncerAddress, poolRoles?.bouncer?.toString()) as string,
        newNominator: getChangedValue(newNominatorAddress, poolRoles?.nominator?.toString()) as string,
        newRoot: getChangedValue(newRootAddress, poolRoles?.root?.toString()) as string
      }
    });
  }, [commissionValue, maybeCommissionPayee, poolName, poolRoles, newBouncerAddress, newCommissionPayee, newCommissionValue, newNominatorAddress, newPoolName, newRootAddress, setChanges]);

  useEffect(() => {
    api?.query['nominationPools']['globalMaxCommission']().then((maybeResponse) => {
      const res = maybeResponse as Option<Perbill>;

      if (res.isSome) {
        setMaxCommission(res.unwrap());
      }
    }).catch(console.error);
  }, [api]);

  const getChangedValue = (newValue: string | number | null | undefined, oldValue: number | string | null | undefined): undefined | null | string | number => {
    if ((newValue === null || newValue === undefined) && oldValue) {
      return null;
    }

    if ((newValue !== null || newValue !== undefined) && newValue !== oldValue) {
      return newValue;
    }

    return undefined;
  };

  const goReview = useCallback(() => {
    setStep(STEPS.REVIEW);
  }, [setStep]);

  const _onPoolNameChange = useCallback((name: string) => {
    setNewPoolName(name);
  }, []);

  const nextBtnDisable = changes && Object.values(changes).every((value) => {
    if (typeof value === 'object' && value !== null) {
      return Object.values(value as Record<string, unknown>).every((nestedValue) => nestedValue === undefined);
    }

    return value === undefined;
  });

  const onNewCommission = useCallback((e: { target: { value: any; }; }) => {
    const value = Number(e.target.value);

    if (value !== commissionValue) {
      setNewCommissionValue(value > 100 ? 100 : value);
    } else {
      setNewCommissionValue(undefined);
    }
  }, [commissionValue]);

  return (
    <>
      <Grid container m='25px auto'>
        <AutoResizeTextarea label={t('Pool name')} onChange={_onPoolNameChange} value={newPoolName} width='435px' />
      </Grid>
      <CollapseIt
        fullWidth
        open={open}
        show={collapsedName === t('Roles')}
        title={t('Roles')}
      >
        <>
          <AddressInput
            address={depositorAddress}
            chain={chain}
            disabled
            label={'Depositor'}
            showIdenticon
            style={{
              m: '15px auto 0',
              width: '98%'
            }}
          />
          <AddressInput
            address={newRootAddress}
            allAddresses={allAddresses}
            chain={chain}
            label={'Root'}
            setAddress={setNewRootAddress}
            showIdenticon
            style={{
              m: '15px auto 0',
              width: '98%'
            }}
          />
          <AddressInput
            address={newNominatorAddress}
            allAddresses={allAddresses}
            chain={chain}
            label={t('Nominator')}
            setAddress={setNewNominatorAddress}
            showIdenticon
            style={{
              m: '15px auto 0',
              width: '98%'
            }}
          />
          <AddressInput
            address={newBouncerAddress}
            allAddresses={allAddresses}
            chain={chain}
            label={t('Bouncer')}
            setAddress={setNewBouncerAddress}
            showIdenticon
            style={{
              m: '15px auto 10px 0',
              width: '98%'
            }}
          />
        </>
      </CollapseIt>
      <CollapseIt
        fullWidth
        open={open}
        show={collapsedName === t('Commission')}
        title={t('Commission')}
      >
        <>
          <Grid container item>
            <Grid container item>
              <Typography fontSize='14px' fontWeight={400} lineHeight='25px' mt='10px' overflow='hidden' textOverflow='ellipsis' whiteSpace='nowrap'>
                {t('Percent')}
              </Typography>
            </Grid>
            <Input
              autoCapitalize='off'
              autoCorrect='off'
              fontSize='18px'
              height='32px'
              margin='auto 0 3px'
              max={100}
              // eslint-disable-next-line react/jsx-no-bind
              onChange={(e) => onNewCommission(e)}
              padding='0px'
              placeholder={`${commissionValue}%`}
              spellCheck={false}
              textAlign='center'
              theme={theme}
              type='number'
              width='62%'
            />
            <Grid alignItems='center' container item justifyContent='flex-start' sx={{ fontWeight: 500, pl: '10px', textDecorationLine: 'underLine', width: '35%' }}>
              <Grid item pr='5px'>
                {t('Max')}:
              </Grid>
              <Grid item>
                <ShowValue value={maxCommission?.toHuman()} width='58px' />
              </Grid>
            </Grid>
          </Grid>
          <AddressInput
            address={newCommissionPayee}
            allAddresses={allAddresses}
            chain={chain}
            label={t('Payee')}
            setAddress={setNewCommissionPayee}
            showIdenticon
            style={{ m: '15px auto 0' }}
          />
        </>
      </CollapseIt>
      <Grid container item sx={{ '> div': { ml: 'auto', width: '87.5%' }, bottom: 0, height: '36px', position: 'absolute' }}>
        <ButtonWithCancel
          _onClick={goReview}
          _onClickCancel={onClose}
          disabled={nextBtnDisable}
          text={t('Next')}
        />
      </Grid>
    </>
  );
}

export default React.memo(Edit);
