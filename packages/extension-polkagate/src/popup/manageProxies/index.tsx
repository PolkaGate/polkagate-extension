// Copyright 2019-2024 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable react/jsx-max-props-per-line */

import { AddRounded as AddRoundedIcon } from '@mui/icons-material';
import { Grid, Typography } from '@mui/material';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import { BN, BN_ZERO } from '@polkadot/util';

import { ActionContext, PButton, ProxyTable, ShowBalance } from '../../components';
import { useInfo, useTranslation } from '../../hooks';
import { HeaderBrand } from '../../partials';
import { Proxy, ProxyItem } from '../../util/types';
import AddProxy from './AddProxy';
import Review from './Review';

export const STEPS = {
  INDEX: 1,
  ADD_PROXY: 2,
  REVIEW: 3,
  WAIT_SCREEN: 4,
  CONFIRM: 5,
  PROXY: 100,
  SIGN_QR: 200
};

export default function ManageProxies(): React.ReactElement {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);
  const { address } = useParams<{ address: string }>();
  const { account, api, chain, formatted } = useInfo(address);

  const [proxyItems, setProxyItems] = useState<ProxyItem[] | undefined>();
  const [helperText, setHelperText] = useState<string>();
  const [depositValue, setDepositValue] = useState<BN | undefined>();
  const [disableAddProxyButton, setEnableAddProxyButton] = useState<boolean>(true);
  const [disableToConfirmButton, setEnableToConfirmButton] = useState<boolean>(true);
  const [available, setAvailable] = useState<number>(0);
  const [step, setStep] = useState<number>(STEPS.INDEX);

  const proxyDepositBase = api ? api.consts.proxy.proxyDepositBase as unknown as BN : BN_ZERO;
  const proxyDepositFactor = api ? api.consts.proxy.proxyDepositFactor as unknown as BN : BN_ZERO;

  const depositToPay = useMemo(() => {
    if (!proxyItems || proxyItems.length === 0) {
      return BN_ZERO;
    }

    const currentProxies = proxyItems.filter((proxyItem) => proxyItem.status === 'current');
    const newProxiesLength = proxyItems.filter((proxyItem) => proxyItem.status === 'new').length;
    const removeProxiesLength = proxyItems.filter((proxyItem) => proxyItem.status === 'remove').length;

    if (currentProxies.length === 0 && removeProxiesLength === 0) {
      return depositValue;
    }

    const alreadyHasProxyDeposit = (proxyDepositFactor.muln((currentProxies.length + removeProxiesLength))).add(proxyDepositBase);

    if (newProxiesLength > removeProxiesLength) {
      return alreadyHasProxyDeposit.add(proxyDepositFactor.muln(newProxiesLength - removeProxiesLength));
    } else {
      return BN_ZERO;
    }
  }, [depositValue, proxyDepositBase, proxyDepositFactor, proxyItems]);

  const onBackClick = useCallback(() => {
    if ([STEPS.ADD_PROXY, STEPS.REVIEW].includes(step)) {
      setStep(STEPS.INDEX);
    } else {
      onAction('/');
    }
  }, [onAction, step]);

  const openAddProxy = useCallback(() => {
    !disableAddProxyButton && setStep(STEPS.ADD_PROXY);
  }, [disableAddProxyButton]);

  const toReview = useCallback(() => {
    setStep(STEPS.REVIEW);
  }, []);

  const checkForChanges = useCallback(() => {
    if (!disableAddProxyButton) {
      const anyChanges = proxyItems?.length === proxyItems?.filter((item) => item.status === 'current')?.length;

      !anyChanges && setEnableToConfirmButton(false);
      anyChanges && setEnableToConfirmButton(true);
    }

    setAvailable(proxyItems?.filter(({ status }) => status !== 'remove')?.length ?? 0);
  }, [disableAddProxyButton, proxyItems]);

  const onSelect = useCallback((selected: Proxy) => {
    if (!proxyItems) {
      return;
    }

    const found = proxyItems.find(({ proxy }) => proxy.delegate === selected.delegate && proxy.proxyType === selected.proxyType);

    if (!found) {
      return;
    }

    const toDeleteIndex = proxyItems.indexOf(found);

    if (toDeleteIndex === -1) {
      return;
    }

    if (proxyItems[toDeleteIndex].status === 'current') {
      proxyItems[toDeleteIndex].status = 'remove';
      setProxyItems(proxyItems);
      checkForChanges();

      return;
    }

    if (proxyItems[toDeleteIndex].status === 'remove') {
      proxyItems[toDeleteIndex].status = 'current';
      setProxyItems(proxyItems);
      checkForChanges();

      return;
    }

    if (proxyItems[toDeleteIndex].status === 'new') {
      proxyItems.splice(toDeleteIndex, 1);
      setProxyItems(proxyItems);
      checkForChanges();
    }
  }, [checkForChanges, proxyItems]);

  useEffect(() => {
    !available ? setDepositValue(BN_ZERO) : setDepositValue(proxyDepositBase.add(proxyDepositFactor.muln(available))) as unknown as BN;
    checkForChanges();
  }, [address, api, available, chain, checkForChanges, proxyDepositBase, proxyDepositFactor, proxyItems]);

  useEffect(() => {
    proxyItems !== undefined && setEnableAddProxyButton(false);
    checkForChanges();
  }, [account?.isExternal, checkForChanges, proxyItems]);

  useEffect(() => {
    setHelperText(t('Add new proxies or select existing ones to remove for this account, and please consider the deposit that will be reserved.'));
    proxyItems !== undefined && disableAddProxyButton && setHelperText(t('This is a watch-only account and cannot sign transactions, and there is no proxy associated with this account.'));
    !disableToConfirmButton && setHelperText(t("You can still modify the proxies you're adding, add new proxies, or select existing proxies to remove them. Once done, click 'Next' to confirm all transactions."));
  }, [disableAddProxyButton, disableToConfirmButton, proxyItems, t]);

  useEffect(() => {
    formatted && api && api.query.proxy?.proxies(formatted).then((proxies) => {
      const fetchedProxyItems = (JSON.parse(JSON.stringify(proxies[0])))?.map((p: Proxy) => ({ proxy: p, status: 'current' })) as ProxyItem[];

      setProxyItems(fetchedProxyItems);
    });
  }, [api, chain, formatted]);

  return (
    <>
      <HeaderBrand
        onBackClick={onBackClick}
        showBackArrow
        showClose
        text={step === STEPS.ADD_PROXY ? t('Add Proxy') : t('Manage Proxies')}
      />
      {step === STEPS.INDEX &&
        <>
          <Typography fontSize='14px' fontWeight={300} m='25px auto' textAlign='left' width='90%'>
            {helperText}
          </Typography>
          <Grid container m='auto' sx={{ opacity: disableAddProxyButton ? 0.5 : 1 }} width='92%'>
            <Grid display='inline-flex' item onClick={openAddProxy} sx={{ cursor: disableAddProxyButton ? 'context-menu' : 'pointer' }}>
              <AddRoundedIcon
                sx={{
                  bgcolor: 'primary.main',
                  borderRadius: '50px',
                  color: '#fff',
                  fontSize: '36px'
                }}
              />
              <Typography fontSize='16px' fontWeight={400} lineHeight='36px' pl='10px' sx={{ textDecoration: 'underline' }}>
                {t('Add proxy')}
              </Typography>
            </Grid>
          </Grid>
          <ProxyTable
            chain={chain}
            label={t('Proxies')}
            maxHeight={window.innerHeight / 2.5}
            mode='Delete'
            notFoundText={t('No proxies found.')}
            onSelect={onSelect}
            proxies={proxyItems}
            style={{
              m: '20px auto 10px',
              width: '92%'
            }}
          />
          <Grid alignItems='end' container sx={{ m: 'auto', width: '92%' }}>
            <Typography
              fontSize='14px'
              fontWeight={300}
              lineHeight='23px'
            >
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
          <PButton
            _onClick={toReview}
            disabled={disableToConfirmButton}
            text={t('Next')}
          />
        </>
      }
      {step === STEPS.ADD_PROXY && proxyItems && api &&
        <AddProxy
          address={address}
          api={api}
          chain={chain}
          onChange={checkForChanges}
          proxyItems={proxyItems}
          setProxyItems={setProxyItems}
          setStep={setStep}
        />
      }
      {[STEPS.PROXY, STEPS.SIGN_QR, STEPS.REVIEW, STEPS.WAIT_SCREEN, STEPS.CONFIRM].includes(step) && api && depositValue && proxyItems &&
        <Review
          address={address}
          api={api}
          chain={chain}
          depositToPay={depositToPay}
          depositValue={depositValue}
          proxies={proxyItems}
          setStep={setStep}
          step={step}
        />
      }
    </>
  );
}
