// Copyright 2019-2024 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable react/jsx-max-props-per-line */

import type { ApiPromise } from '@polkadot/api';
import type { SubmittableExtrinsicFunction } from '@polkadot/api/types/submittable';
import type { Chain } from '@polkadot/extension-chains/types';
import type { Balance } from '@polkadot/types/interfaces';
import type { AnyTuple } from '@polkadot/types/types';
import type { MyPoolInfo, Proxy, ProxyItem, TxInfo } from '../../../../../util/types';
import type { StakingInputs } from '../../../type';
import type { ChangesProps } from '.';

import { Divider, Grid, Typography } from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';

import SelectProxyModal2 from '@polkadot/extension-polkagate/src/fullscreen/governance/components/SelectProxyModal2';
import { PROXY_TYPE } from '@polkadot/extension-polkagate/src/util/constants';
import { BN_ONE } from '@polkadot/util';

import { AccountHolderWithProxy, Infotip, ShowValue, SignArea2, WrongPasswordAlert } from '../../../../../components';
import { useProxies, useTranslation } from '../../../../../hooks';
import { STEPS } from '../../stake';
import ShowPoolRole from './ShowPoolRole';

interface Props {
  address: string;
  api: ApiPromise | undefined;
  chain: Chain | null | undefined;
  changes?: ChangesProps;
  formatted: string;
  pool: MyPoolInfo;
  setRefresh: React.Dispatch<React.SetStateAction<boolean>>
  setStep: React.Dispatch<React.SetStateAction<number>>;
  setTxInfo: React.Dispatch<React.SetStateAction<TxInfo | undefined>>;
  step: number;
}

const getRole = (role: string | undefined | null) => {
  if (role === undefined) {
    return 'Noop';
  } else if (role === null) {
    return 'Remove';
  } else {
    return { set: role };
  }
};

const usePoolTransactionPreparation = (api: ApiPromise | undefined, changes: ChangesProps | undefined, pool: MyPoolInfo, formatted: string, maybeCurrentCommissionPayee?: string) => {
  const [inputs, setInputs] = useState<StakingInputs>();
  const [estimatedFee, setEstimatedFee] = useState<Balance>();

  useEffect(() => {
    if (!api || !changes) {
      return;
    }

    const { nominationPools: { setCommission, setMetadata, updateRoles }, utility: { batchAll } } = api.tx;

    const txs: { call: SubmittableExtrinsicFunction<'promise', AnyTuple>, params: unknown[] }[] = [];

    if (changes.newPoolName !== undefined) {
      txs.push({ call: setMetadata, params: [pool.poolId, changes.newPoolName] });
    }

    if (changes.newRoles && !Object.values(changes.newRoles).every((value) => value === undefined)) {
      txs.push({
        call: updateRoles,
        params: [
          pool.poolId,
          getRole(changes.newRoles?.newRoot),
          getRole(changes.newRoles?.newNominator),
          getRole(changes.newRoles?.newBouncer)
        ]
      });
    }

    if (changes.commission &&
        (changes.commission.value !== undefined || changes.commission.payee)) {
      txs.push({
        call: setCommission,
        params: [
          pool.poolId,
          [
            (changes.commission.value || 0) * 10 ** 7,
            changes.commission.payee || maybeCurrentCommissionPayee
          ]
        ]
      });
    }

    const call = txs.length > 1 ? batchAll : txs[0].call;
    const params = txs.length > 1
      ? [txs.map(({ call, params }) => call(...params))]
      : txs[0].params;

    let fee: Balance = api.createType('Balance', BN_ONE) as Balance;

    // Estimate transaction fee
    if (!api?.call?.['transactionPaymentApi']) {
      fee = api.createType('Balance', BN_ONE) as Balance;
      setEstimatedFee(fee);
    }

    call(...params).paymentInfo(formatted)
      .then((i) => {
        fee = api.createType('Balance', i?.partialFee) as Balance;
        setEstimatedFee(fee);
      })
      .catch(console.error);

    const extraInfo = {
      action: 'Pool Staking',
      fee: String(fee ?? 0),
      subAction: 'Edit Pool'
    };

    setInputs({
      call,
      extraInfo,
      params
    });
  }, [api, changes, pool, formatted, maybeCurrentCommissionPayee]);

  return { estimatedFee, inputs };
};

function Review ({ address, api, chain, changes, formatted, pool, setRefresh, setStep, setTxInfo, step }: Props): React.ReactElement {
  const { t } = useTranslation();
  const proxies = useProxies(api, formatted);

  const [selectedProxy, setSelectedProxy] = useState<Proxy | undefined>();
  const [proxyItems, setProxyItems] = useState<ProxyItem[]>();
  const [isPasswordError, setIsPasswordError] = useState(false);

  const selectedProxyAddress = selectedProxy?.delegate as unknown as string;

  //@ts-ignore
  const maybeCurrentCommissionPayee = pool?.bondedPool?.commission?.current?.[1]?.toString() as string | undefined;

  useEffect((): void => {
    const fetchedProxyItems = proxies?.map((p: Proxy) => ({ proxy: p, status: 'current' })) as ProxyItem[];

    setProxyItems(fetchedProxyItems);
  }, [proxies]);

  const { estimatedFee, inputs } = usePoolTransactionPreparation(api, changes, pool, formatted,maybeCurrentCommissionPayee);

  const closeProxy = useCallback(() => setStep(STEPS.REVIEW), [setStep]);

  const onBackClick = useCallback(() => {
    setSelectedProxy(undefined);
    setStep(STEPS.INDEX);
  }, [setStep, setSelectedProxy]);

  return (
    <Grid container direction='column' item pt='15px'>
      {[STEPS.REVIEW, STEPS.SIGN_QR].includes(step) &&
        <>
          <Grid container item sx={{ maxHeight: '405px', overflow: 'scroll' }}>
            {isPasswordError &&
              <WrongPasswordAlert />
            }
            <AccountHolderWithProxy
              address={address}
              chain={chain}
              selectedProxyAddress={selectedProxyAddress}
              style={{ mt: 'auto' }}
              title={t('Account')}
            />
            <Divider sx={{ bgcolor: 'secondary.main', height: '2px', m: '5px auto', width: '240px' }} />
            {changes?.newPoolName !== undefined &&
              <>
                <Grid alignItems='center' container direction='column' justifyContent='center' sx={{ m: 'auto', pt: '8px', width: '90%' }}>
                  <Infotip showQuestionMark text={changes?.newPoolName}>
                    <Typography fontSize='16px' fontWeight={300} lineHeight='23px'>
                      {t('Pool name')}
                    </Typography>
                  </Infotip>
                  <Typography fontSize='25px' fontWeight={400} lineHeight='42px' maxWidth='100%' overflow='hidden' textOverflow='ellipsis' whiteSpace='nowrap'>
                    {changes?.newPoolName}
                  </Typography>
                </Grid>
                {changes?.newRoles &&
                  <Divider sx={{ bgcolor: 'secondary.main', height: '2px', m: '5px auto', width: '240px' }} />
                }
              </>}
            {changes?.newRoles?.newRoot !== undefined &&
              <ShowPoolRole
                chain={chain}
                roleAddress={changes?.newRoles?.newRoot as string}
                roleTitle={t('Root')}
                showDivider
              />
            }
            {changes?.newRoles?.newNominator !== undefined &&
              <ShowPoolRole
                chain={chain}
                roleAddress={changes?.newRoles?.newNominator}
                roleTitle={t('Nominator')}
                showDivider
              />
            }
            {changes?.newRoles?.newBouncer !== undefined &&
              <ShowPoolRole
                chain={chain}
                roleAddress={changes?.newRoles?.newBouncer}
                roleTitle={t('Bouncer')}
                showDivider
              />
            }
            {changes?.commission?.value !== undefined &&
              <Grid alignItems='center' container direction='column' justifyContent='center' sx={{ m: 'auto', pt: '5px', width: '90%' }}>
                <Grid item>
                  <Typography fontSize='16px' fontWeight={300} lineHeight='23px'>
                    {t('Commission value')}
                  </Typography>
                </Grid>
                <Grid fontSize='28px' fontWeight={400} item>
                  {changes.commission.value}%
                </Grid>
                <Divider sx={{ bgcolor: 'secondary.main', height: '2px', m: '5px auto', width: '240px' }} />
              </Grid>
            }
            {changes?.commission?.payee !== undefined &&
              <ShowPoolRole
                chain={chain}
                roleAddress={changes.commission.payee || maybeCurrentCommissionPayee}
                roleTitle={t('Commission payee')}
                showDivider
              />
            }
            <Grid alignItems='center' container item justifyContent='center' lineHeight='20px'>
              <Grid item>
                {t('Fee')}:
              </Grid>
              <Grid item sx={{ pl: '5px' }}>
                <ShowValue height={16} value={estimatedFee?.toHuman()} />
              </Grid>
            </Grid>
          </Grid>
          <Grid container item sx={{ bottom: '15px', height: '120px', position: 'absolute', width: '86%' }}>
            <SignArea2
              address={address}
              call={inputs?.call}
              extraInfo={inputs?.extraInfo}
              isPasswordError={isPasswordError}
              onSecondaryClick={onBackClick}
              params={inputs?.params}
              primaryBtnText={t('Confirm')}
              proxyTypeFilter={PROXY_TYPE.NOMINATION_POOLS}
              secondaryBtnText={t('Back')}
              selectedProxy={selectedProxy}
              setIsPasswordError={setIsPasswordError}
              setRefresh={setRefresh}
              setSelectedProxy={setSelectedProxy}
              setStep={setStep}
              setTxInfo={setTxInfo}
              showBackButtonWithUseProxy
              step={step}
              steps={STEPS}
            />
          </Grid>
        </>
      }
      {step === STEPS.PROXY &&
        <SelectProxyModal2
          address={address}
          closeSelectProxy={closeProxy}
          height={500}
          proxies={proxyItems}
          proxyTypeFilter={PROXY_TYPE.NOMINATION_POOLS}
          selectedProxy={selectedProxy}
          setSelectedProxy={setSelectedProxy}
        />
      }
    </Grid>
  );
}

export default React.memo(Review);
