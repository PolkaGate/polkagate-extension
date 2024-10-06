// Copyright 2019-2024 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0
// @ts-nocheck
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description
 * this component opens
 * */

import type { DeriveBalancesAll } from '@polkadot/api-derive/types';
import type { AccountId, Balance } from '@polkadot/types/interfaces';
import type { FormattedAddressState, TransferType } from '../../util/types';

import { Container } from '@mui/material';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { useHistory } from 'react-router-dom';

import { AccountsStore } from '@polkadot/extension-base/stores';
import keyring from '@polkadot/ui-keyring';
import { BN, BN_ONE, BN_ZERO } from '@polkadot/util';
import { cryptoWaitReady } from '@polkadot/util-crypto';

import { AccountInputWithIdentity, AmountWithOptions, From, Motion, PButton } from '../../components';
import { useAccountName, useIdentity, useInfo, useTranslation } from '../../hooks';
import { HeaderBrand } from '../../partials';
import Asset from '../../partials/Asset';
import { MAX_AMOUNT_LENGTH } from '../../util/constants';
import { amountToHuman, amountToMachine, isValidAddress } from '../../util/utils';
import Review from './Review';
import { getValue } from '../account/util';

export default function Send(): React.ReactElement {
  const { t } = useTranslation();
  const history = useHistory();
  const { address } = useParams<FormattedAddressState>();
  const { api, chain, decimal, formatted, genesisHash } = useInfo(address);

  const [estimatedFee, setEstimatedFee] = useState<Balance>();
  const [maxFee, setMaxFee] = useState<Balance>();
  const [recipientAddress, setRecipientAddress] = useState<string | null | undefined>();
  const recipientNameIfIsInExtension = useAccountName(recipientAddress as string);
  const recipientInfo = useIdentity(genesisHash, recipientAddress as string);
  const [amount, setAmount] = useState<string>();
  const [balances, setBalances] = useState<DeriveBalancesAll | undefined>();
  const [transferType, setTransferType] = useState<TransferType | undefined>();
  const [buttonDisabled, setButtonDisabled] = useState<boolean>(true);
  const [recipientName, setRecipientName] = useState<string>();
  const [showReview, setShowReview] = useState<boolean>();

  const transfer = api && api.tx?.['balances'] && (['All', 'Max'].includes(transferType as string) ? (api.tx['balances']['transferAll']) : (api.tx['balances']['transferKeepAlive']));
  const amountAsBN = useMemo(() => amountToMachine(amount, decimal), [amount, decimal]);
  const transferableBalance = useMemo(() => getValue('transferable', balances), [balances]);

  useEffect(() => {
    setRecipientName(recipientInfo?.identity?.display || recipientNameIfIsInExtension || t('Unknown'));
  }, [recipientInfo?.identity?.display, recipientNameIfIsInExtension, t]);

  const setWholeAmount = useCallback((type: TransferType) => {
    if (!api || !transferableBalance || !maxFee || !decimal) {
      return;
    }

    setTransferType(type);
    const ED = type === 'Max' ? api.consts['balances']['existentialDeposit'] as unknown as BN : BN_ZERO;
    const allMaxAmount = transferableBalance.isZero() ? '0' : amountToHuman(transferableBalance.sub(maxFee).sub(ED).toString(), decimal);

    setAmount(allMaxAmount);
  }, [api, transferableBalance, decimal, maxFee]);

  useEffect(() => {
    if (!decimal) {
      return;
    }

    const isAmountLessThanAllTransferAble = amountAsBN.gt(transferableBalance?.sub(maxFee ?? BN_ZERO) ?? BN_ZERO);

    setButtonDisabled(!isValidAddress(recipientAddress as string) || !amount || (amount === '0') || isAmountLessThanAllTransferAble);
  }, [amount, amountAsBN, api, transferableBalance, decimal, maxFee, recipientAddress]);

  useEffect(() => {
    // eslint-disable-next-line no-void
    api && void api.derive.balances?.all(formatted as string).then((b) => {
      setBalances(b);
    });
  }, [api, formatted]);

  useEffect(() => {
    if (!api || !transfer || !formatted || !decimal) {
      return;
    }

    if (!api?.call?.['transactionPaymentApi']) {
      return setEstimatedFee(api?.createType('Balance', BN_ONE));
    }

    let params = [];

    if (['All', 'Max'].includes(transferType as string)) {
      const keepAlive = transferType === 'Max';

      params = [formatted, keepAlive]; // just for estimatedFee calculation, sender and receiver are the same
    } else {
      params = [formatted, amountAsBN];
    }

    // eslint-disable-next-line no-void
    void transfer(...params).paymentInfo(formatted)
      .then((i) => setEstimatedFee(i?.partialFee)).catch(console.error);
  }, [api, formatted, transfer, amount, decimal, transferType, amountAsBN]);

  useEffect(() => {
    if (!api) {
      return;
    }

    if (!api?.call?.['transactionPaymentApi']) {
      return setEstimatedFee(api?.createType('Balance', BN_ONE));
    }

    transfer && transferableBalance && formatted && transfer(formatted, transferableBalance).paymentInfo(formatted)
      .then((i) => setMaxFee(i?.partialFee)).catch(console.error);
  }, [api, formatted, transfer, transferableBalance]);

  useEffect(() => {
    cryptoWaitReady()
      .then((): void => {
        keyring.loadAll({ store: new AccountsStore() });
      })
      .catch(() => null);
  }, []);

  const _onBackClick = useCallback(() => {
    chain?.genesisHash && history.push({
      pathname: `/account/${chain?.genesisHash}/${address}/`
    });
  }, [address, chain?.genesisHash, history]);

  const goToReview = useCallback(() => {
    setShowReview(true);
  }, []);

  const _onChangeAmount = useCallback((value: string) => {
    if (!decimal) {
      return;
    }

    if (value.length > decimal - 1) {
      console.log(`The amount digits is more than decimal:${decimal}`);

      return;
    }

    setTransferType('Normal');

    setAmount(value.slice(0, MAX_AMOUNT_LENGTH));
  }, [decimal]);

  return (
    <Motion>
      <HeaderBrand
        onBackClick={_onBackClick}
        shortBorder
        showBackArrow
        showClose
        text={t<string>('Send Fund')}
        withSteps={{
          current: 1,
          total: 2
        }}
      />
      <Container disableGutters sx={{ px: '15px' }}>
        <From
          address={address}
          api={api}
          title={t<string>('From')}
        />
        <AccountInputWithIdentity
          address={recipientAddress}
          chain={chain}
          ignoreAddress={formatted}
          label={t('To')}
          name={recipientName}
          setAddress={setRecipientAddress}
          style={{ pt: '15px' }}
        />
        <Asset
          address={address}
          api={api}
          balanceLabel={t('Available balance')}
          balanceType='available'
          balances={balances}
          fee={estimatedFee}
          style={{ pt: '15px' }}
        />
        <AmountWithOptions
          label={t<string>('Amount')}
          onChangeAmount={_onChangeAmount}
          onPrimary={() => setWholeAmount('Max')}
          onSecondary={() => setWholeAmount('All')}
          primaryBtnText={t<string>('Max amount')}
          secondaryBtnText={t<string>('All amount')}
          style={{ pt: '15px' }}
          value={amount}
        />
      </Container>
      <PButton
        _onClick={goToReview}
        disabled={buttonDisabled}
        text={t<string>('Next')}
      />
      {showReview && amount &&
        <Review
          address={address}
          amount={amount}
          api={api}
          chain={chain as any}
          estimatedFee={estimatedFee}
          recipientAddress={recipientAddress as string}
          recipientName={recipientName}
          setShow={setShowReview}
          show={showReview}
          transfer={transfer}
          transferType={transferType}
        />
      }
    </Motion>
  );
}
