// Copyright 2019-2024 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable react/jsx-max-props-per-line */

import type { SubmittableExtrinsic } from '@polkadot/api/types';
import type { Balance } from '@polkadot/types/interfaces';

import { Divider, Grid, Typography } from '@mui/material';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { ApiPromise } from '@polkadot/api';
import { Chain } from '@polkadot/extension-chains/types';
import { BN, BN_ONE } from '@polkadot/util';

import { ActionContext, CanPayErrorAlert, PopupSignArea, ProxyTable, ShowBalance, WrongPasswordAlert } from '../../components';
import { useAccountDisplay, useCanPayFeeAndDeposit, useFormatted } from '../../hooks';
import useTranslation from '../../hooks/useTranslation';
import { SubTitle, WaitScreen } from '../../partials';
import Confirmation from '../../partials/Confirmation';
import { Proxy, ProxyItem, TxInfo } from '../../util/types';
import { getSubstrateAddress } from '../../util/utils';
import ManageProxiesTxDetail from './partials/ManageProxiesTxDetail';
import { STEPS } from '.';

interface Props {
  address: string;
  api: ApiPromise;
  chain: Chain;
  depositValue: BN;
  proxies: ProxyItem[];
  depositToPay: BN | undefined;
  step: number;
  setStep: React.Dispatch<React.SetStateAction<number>>;
}

export default function Review ({ address, api, chain, depositToPay, depositValue, proxies, setStep, step }: Props): React.ReactElement {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);
  const formatted = useFormatted(address);

  const [helperText, setHelperText] = useState<string | undefined>();
  const [estimatedFee, setEstimatedFee] = useState<Balance | undefined>();
  const [txInfo, setTxInfo] = useState<TxInfo | undefined>();
  const [isPasswordError, setIsPasswordError] = useState<boolean>(false);
  const [selectedProxy, setSelectedProxy] = useState<Proxy | undefined>();

  const selectedProxyAddress = selectedProxy?.delegate as unknown as string;
  const selectedProxyName = useAccountDisplay(getSubstrateAddress(selectedProxyAddress));

  const canPayFeeAndDeposit = useCanPayFeeAndDeposit(formatted, selectedProxy?.delegate, estimatedFee, depositToPay);

  const removeProxy = api.tx.proxy.removeProxy; /** (delegate, proxyType, delay) **/
  const addProxy = api.tx.proxy.addProxy; /** (delegate, proxyType, delay) **/
  const batchAll = api.tx.utility.batchAll;

  const proxiesToChange = useMemo(() => proxies.filter(({ status }) => ['remove', 'new'].includes(status)), [proxies]);

  const { call, params } = useMemo(() => {
    if (proxiesToChange.length === 0 || !addProxy || !removeProxy || !batchAll) {
      return { call: undefined, params: undefined };
    }

    if (proxiesToChange.length === 1) {
      const { delay, delegate, proxyType } = proxiesToChange[0].proxy;

      return proxiesToChange[0].status === 'new'
        ? { call: addProxy, params: [delegate, proxyType, delay] }
        : { call: removeProxy, params: [delegate, proxyType, delay] };
    }

    const params: SubmittableExtrinsic<'promise'>[] = [];

    proxiesToChange.forEach(({ proxy, status }) => {
      const { delay, delegate, proxyType } = proxy;

      status === 'remove' && params.push(removeProxy(delegate, proxyType, delay));
      status === 'new' && params.push(addProxy(delegate, proxyType, delay));
    });

    return { call: batchAll, params: [params] };
  }, [addProxy, batchAll, proxiesToChange, removeProxy]);

  useEffect(() => {
    if (!call || !params || !formatted) {
      return;
    }

    if (!api?.call?.transactionPaymentApi) {
      return setEstimatedFee(api?.createType('Balance', BN_ONE));
    }

    // eslint-disable-next-line no-void
    void call(...params).paymentInfo(formatted).then((i) => setEstimatedFee(i?.partialFee));
  }, [api, call, formatted, params]);

  useEffect(() => {
    const addingLength = proxies.filter((item) => item.status === 'new').length;
    const removingLength = proxies.filter((item) => item.status === 'remove').length;

    addingLength && setHelperText(t('You are adding {{addingLength}} Prox{{iesOrY}}', { replace: { addingLength, iesOrY: addingLength > 1 ? 'ies' : 'y' } }));
    removingLength && setHelperText(t('You are removing {{removingLength}} Prox{{iesOrY}}', { replace: { iesOrY: removingLength > 1 ? 'ies' : 'y', removingLength } }));
    addingLength && removingLength && setHelperText(t('Adding {{addingLength}} and removing {{removingLength}} Proxies', { replace: { addingLength, removingLength } }));
  }, [proxies, t]);

  const extraInfo = useMemo(() => ({
    action: 'Manage Proxy',
    fee: String(estimatedFee || 0),
    subAction: 'Add/Remove Proxy'
  }), [estimatedFee]);

  const onBackClick = useCallback(() => {
    setStep(STEPS.INDEX);
  }, [setStep]);

  const goToMyAccounts = useCallback(() => {
    onAction('/');
  }, [onAction]);

  return (
    <>
      {[STEPS.REVIEW, STEPS.PROXY, STEPS.SIGN_QR].includes(step) &&
        <>
          {isPasswordError &&
            <WrongPasswordAlert />
          }
          {canPayFeeAndDeposit.isAbleToPay === false &&
            <CanPayErrorAlert canPayStatements={canPayFeeAndDeposit.statement} />
          }
          <Grid container my='20px'>
            <SubTitle label={t('Review')} />
          </Grid>
          <Typography textAlign='center'>
            {helperText}
          </Typography>
          <ProxyTable
            chain={chain}
            label={t('Proxies')}
            maxHeight={window.innerHeight / 3}
            mode='Status'
            proxies={proxiesToChange}
            style={{
              m: '20px auto 10px',
              width: '92%'
            }}
          />
          <Grid alignItems='center' container justifyContent='center' m='20px auto 5px' width='92%'>
            <Grid display='inline-flex' item>
              <Typography fontSize='14px' fontWeight={300} lineHeight='23px'>
                {t('Deposit')}:
              </Typography>
              <Grid item lineHeight='22px' pl='5px'>
                <ShowBalance
                  api={api}
                  balance={depositValue}
                  decimalPoint={4}
                  height={22}
                />
              </Grid>
            </Grid>
            <Divider orientation='vertical' sx={{ backgroundColor: 'secondary.main', height: '30px', mx: '5px', my: 'auto' }} />
            <Grid display='inline-flex' item>
              <Typography fontSize='14px' fontWeight={300} lineHeight='23px'>
                {t('Fee')}:
              </Typography>
              <Grid item lineHeight='22px' pl='5px'>
                <ShowBalance
                  api={api}
                  balance={estimatedFee}
                  decimalPoint={4}
                  height={22}
                />
              </Grid>
            </Grid>
          </Grid>
          <PopupSignArea
            address={address}
            call={call}
            disabled={canPayFeeAndDeposit.isAbleToPay !== true}
            extraInfo={extraInfo}
            isPasswordError={isPasswordError}
            onSecondaryClick={onBackClick}
            params={params}
            proxyTypeFilter={['Any', 'NonTransfer']}
            selectedProxy={selectedProxy}
            setIsPasswordError={setIsPasswordError}
            setSelectedProxy={setSelectedProxy}
            setStep={setStep}
            setTxInfo={setTxInfo}
            step={step}
            steps={STEPS}
          />
        </>}
      {step === STEPS.WAIT_SCREEN &&
        <WaitScreen
          show
          title={t('Manage Proxies')}
        />
      }
      {step === STEPS.CONFIRM && txInfo &&
        <Confirmation
          headerTitle={t('Manage Proxies')}
          onPrimaryBtnClick={goToMyAccounts}
          primaryBtnText={t('My accounts')}
          showConfirmation
          txInfo={txInfo}
        >
          <ManageProxiesTxDetail
            address={selectedProxyAddress}
            api={api}
            chain={chain}
            deposit={depositValue}
            name={selectedProxyName}
            proxies={proxiesToChange}
          />
        </Confirmation>
      }
    </>
  );
}
