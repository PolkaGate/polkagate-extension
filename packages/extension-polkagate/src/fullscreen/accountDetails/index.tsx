// Copyright 2019-2024 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable react/jsx-max-props-per-line */

import type { Lock } from '../../hooks/useAccountLocks';
import type { FetchedBalance } from '../../hooks/useAssetsBalances';
import type { BalancesInfo } from '../../util/types';

import { faFileInvoice } from '@fortawesome/free-solid-svg-icons';
import { Grid, Stack, useTheme } from '@mui/material';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';

import { BN } from '@polkadot/util';

import { AccountContext, ActionContext, Warning } from '../../components';
import { useAccountAssets, useBalances, useCurrency, useFullscreen, useInfo, usePrices, useTokenPrice, useTranslation } from '../../hooks';
import { getValue } from '../../popup/account/util';
import HistoryModal from '../../popup/history/modal/HistoryModal';
import AccountLabel from '../../popup/home/AccountLabel';
import ReceiveModal from '../../popup/receive/ReceiveModal';
import { ASSET_HUBS, GOVERNANCE_CHAINS, STAKING_CHAINS } from '../../util/constants';
import getParentNameSuri from '../../util/getParentNameSuri';
import FullScreenHeader from '../governance/FullScreenHeader';
import Bread from '../partials/Bread';
import DeriveAccountModal from '../partials/DeriveAccountModal';
import ExportAccountModal from '../partials/ExportAccountModal';
import ForgetAccountModal from '../partials/ForgetAccountModal';
import RenameModal from '../partials/RenameAccountModal';
import { Title } from '../sendFund/InputPage';
import { openOrFocusTab } from './components/CommonTasks';
import ReservedDisplayBalance from './components/ReservedDisplayBalance';
import LockedInReferenda from './unlock/Review';
import { AccountInformationForDetails, AccountSetting, AssetSelect, CommonTasks, DisplayBalance, ExternalLinks, LockedInReferendaFS, TotalChart } from './components';

export enum popupNumbers {
  LOCKED_IN_REFERENDA,
  FORGET_ACCOUNT,
  RENAME,
  EXPORT_ACCOUNT,
  DERIVE_ACCOUNT,
  RECEIVE,
  HISTORY
}

export interface UnlockInformationType {
  classToUnlock: Lock[] | undefined;
  totalLocked: BN | null | undefined;
  unlockableAmount: BN | undefined;
}

export default function AccountDetails (): React.ReactElement {
  useFullscreen();
  const { t } = useTranslation();
  const theme = useTheme();
  const { address, paramAssetId } = useParams<{ address: string, paramAssetId?: string }>();
  const { accounts } = useContext(AccountContext);
  const currency = useCurrency();
  const { account, api, chainName, genesisHash } = useInfo(address);
  const onAction = useContext(ActionContext);
  const accountAssets = useAccountAssets(address);
  const pricesInCurrency = usePrices();

  const [refreshNeeded, setRefreshNeeded] = useState<boolean>(false);
  const [assetIdOnAssetHub, setAssetIdOnAssetHub] = useState<number | string>();
  const [selectedAsset, setSelectedAsset] = useState<FetchedBalance>();
  const [displayPopup, setDisplayPopup] = useState<number | undefined>();
  const [unlockInformation, setUnlockInformation] = useState<UnlockInformationType | undefined>();

  const assetId = useMemo(() =>
    assetIdOnAssetHub !== undefined
      ? assetIdOnAssetHub
      : selectedAsset?.assetId
  , [assetIdOnAssetHub, selectedAsset?.assetId]);

  const { price: currentPrice } = useTokenPrice(address, assetId);

  const balances = useBalances(address, refreshNeeded, setRefreshNeeded, undefined, assetId || undefined);

  const isOnAssetHub = useMemo(() => ASSET_HUBS.includes(genesisHash ?? ''), [genesisHash]);
  const supportGov = useMemo(() => GOVERNANCE_CHAINS.includes(genesisHash ?? ''), [genesisHash]);
  const supportStaking = useMemo(() => STAKING_CHAINS.includes(genesisHash ?? ''), [genesisHash]);
  const showTotalChart = useMemo(() => accountAssets && accountAssets.length > 0 && accountAssets.filter((_asset) => pricesInCurrency && currency && pricesInCurrency.prices[_asset?.priceId]?.value > 0 && !new BN(_asset.totalBalance).isZero()), [accountAssets, currency, pricesInCurrency]);
  const hasParent = useMemo(() => account ? accounts.find(({ address }) => address === account.parentAddress) : undefined, [account, accounts]);

  const balancesToShow = useMemo(() => {
    /** when there is only one we show that one */
    if ((selectedAsset === undefined && balances) || (selectedAsset && balances === undefined)) {
      return selectedAsset || balances;
    }

    /** when both exist but are inconsistent, we show that which matches chain asset id */
    if (selectedAsset && balances && (selectedAsset.genesisHash !== balances.genesisHash || (selectedAsset.genesisHash === balances.genesisHash && selectedAsset.assetId !== balances.assetId))) {
      return selectedAsset?.assetId === assetId ? selectedAsset : balances;
    }

    // FixMe: is chainName check necessary?
    if (!chainName || (balances?.genesisHash && selectedAsset?.genesisHash && balances.genesisHash !== selectedAsset.genesisHash)) {
      return;
    }

    /** when both exists on the same chain, we show one which is more recent */
    return balances?.date && selectedAsset?.date && balances.date > selectedAsset.date
      ? { ...(selectedAsset || {}), ...(balances || {}) }
      : { ...(balances || {}), ...(selectedAsset || {}) };
  }, [assetId, balances, chainName, selectedAsset]);

  const transferableBalance = useMemo(() => getValue('transferable', balancesToShow as BalancesInfo), [balancesToShow]);
  const isDualStaking = useMemo(() =>
    balancesToShow?.soloTotal && balancesToShow?.pooledBalance && !balancesToShow.soloTotal.isZero() && !balancesToShow.pooledBalance.isZero()
  , [balancesToShow?.pooledBalance, balancesToShow?.soloTotal]);

  useEffect(() => {
    // reset assetId on chain switch
    assetIdOnAssetHub && setAssetIdOnAssetHub(undefined);

    // reset selected asset on a chain switch only if its differ from current selected asset's chain
    genesisHash !== selectedAsset?.genesisHash && setSelectedAsset(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genesisHash]);

  useEffect(() => {
    if (selectedAsset !== undefined && paramAssetId && assetId !== undefined && String(assetId) !== paramAssetId) {
      onAction(`/accountfs/${address}/${assetId}`);
    }
  }, [accountAssets, address, assetId, onAction, paramAssetId, selectedAsset]);

  useEffect(() => {
    if (paramAssetId === undefined || !paramAssetId || !genesisHash || selectedAsset) {
      return;
    }

    const maybeAssetIdSelectedInHomePage = assetId !== undefined ? assetId : paramAssetId;

    if (maybeAssetIdSelectedInHomePage as number >= 0 && accountAssets) {
      const found = accountAssets.find(({ assetId, genesisHash: _genesisHash }) => String(assetId) === String(maybeAssetIdSelectedInHomePage) && genesisHash === _genesisHash);

      found && setSelectedAsset(found);
    }
  }, [genesisHash, accountAssets, assetId, paramAssetId, selectedAsset]);

  const onChangeAsset = useCallback((id: number | string) => {
    setAssetIdOnAssetHub(id as number); // this works for asset hubs atm
  }, []);

  const goToSend = useCallback(() => {
    address && onAction(`/send/${address}/${assetId}`);
  }, [address, assetId, onAction]);

  const goToSoloStaking = useCallback(() => {
    address && genesisHash && STAKING_CHAINS.includes(genesisHash) &&
      openOrFocusTab(`/solofs/${address}/`);
  }, [genesisHash, address]);

  const goToPoolStaking = useCallback(() => {
    address && genesisHash && STAKING_CHAINS.includes(genesisHash) && openOrFocusTab(`/poolfs/${address}/`);
  }, [genesisHash, address]);

  const parentNameSuri = getParentNameSuri(hasParent?.name, account?.suri);

  return (
    <Grid bgcolor='backgroundFL.primary' container item justifyContent='center'>
      <FullScreenHeader page='accountDetails' />
      <Grid container item justifyContent='center' sx={{ bgcolor: 'backgroundFL.secondary', height: 'calc(100vh - 70px)', maxWidth: '1282px', overflow: 'scroll' }}>
        <Grid container item sx={{ display: 'block', px: '5%' }}>
          <Stack alignItems='center' direction='row' mt='10px' spacing={2}>
            <Bread />
            <Grid container item width='fit-content'>
              <Title
                height='60px'
                icon={faFileInvoice}
                padding='0px'
                text={t('Account Details')}
              />
            </Grid>
          </Stack>
          <Grid container item justifyContent='space-between' mb='15px'>
            <Grid container direction='column' item mb='10px' minWidth='735px' rowGap='10px' width='calc(100% - 300px - 3%)'>
              <AccountInformationForDetails
                accountAssets={accountAssets}
                address={address}
                label={
                  <AccountLabel
                    account={account}
                    parentName={parentNameSuri}
                    right='0px'
                  />
                }
                price={currentPrice}
                pricesInCurrency={pricesInCurrency}
                selectedAsset={balancesToShow as any}
                setAssetIdOnAssetHub={setAssetIdOnAssetHub}
                setSelectedAsset={setSelectedAsset}
              />
              {genesisHash &&
                <>
                  {isDualStaking &&
                    <Grid container sx={{ '> div': { pl: '3px' } }}>
                      <Warning
                        iconDanger
                        marginTop={0}
                        theme={theme}
                      >
                        {t('Nomination Pools are evolving! Unstake your solo staked funds soon to benefit from automatic pool migration, which allows participation in both a pool and governance, and avoid manual changes.')}
                      </Warning>
                    </Grid>
                  }
                  {isOnAssetHub &&
                    <AssetSelect
                      address={address}
                      assetId={assetId}
                      label={t('Assets')}
                      onChange={onChangeAsset}
                      setAssetId={setAssetIdOnAssetHub}
                      style={{ '> div div div#selectChain': { borderRadius: '5px' }, '> div p': { fontSize: '16px' } }}
                    />
                  }
                  <DisplayBalance
                    amount={transferableBalance}
                    decimal={balancesToShow?.decimal}
                    disabled={!transferableBalance || transferableBalance.isZero()}
                    onClick={goToSend}
                    price={currentPrice}
                    title={t('Transferable')}
                    token={balancesToShow?.token}
                  />
                  {(isOnAssetHub || (!supportGov && !supportStaking && balancesToShow?.lockedBalance && !balancesToShow.lockedBalance.isZero())) &&
                    <DisplayBalance
                      amount={balancesToShow?.lockedBalance}
                      decimal={balancesToShow?.decimal}
                      price={currentPrice} // TODO: double check
                      title={t('Locked')}
                      token={balancesToShow?.token}
                    />}
                  {supportStaking && !balancesToShow?.soloTotal?.isZero() &&
                    <DisplayBalance
                      amount={balancesToShow?.soloTotal}
                      decimal={balancesToShow?.decimal}
                      disabled={!balancesToShow?.soloTotal || balancesToShow?.soloTotal?.isZero()}
                      onClick={goToSoloStaking}
                      price={currentPrice}
                      title={t('Solo Stake')}
                      token={balancesToShow?.token}
                    />}
                  {supportStaking && !balancesToShow?.pooledBalance?.isZero() &&
                    <DisplayBalance
                      amount={balancesToShow?.pooledBalance}
                      decimal={balancesToShow?.decimal}
                      disabled={!balancesToShow?.pooledBalance || balancesToShow?.pooledBalance?.isZero()}
                      onClick={goToPoolStaking}
                      price={currentPrice}
                      title={t('Pool Stake')}
                      token={balancesToShow?.token}
                    />}
                  {supportGov &&
                    <LockedInReferendaFS
                      address={address}
                      price={currentPrice}
                      refreshNeeded={refreshNeeded}
                      setDisplayPopup={setDisplayPopup}
                      setUnlockInformation={setUnlockInformation}
                    />
                  }
                  <ReservedDisplayBalance
                    address={address}
                    amount={balancesToShow?.reservedBalance}
                    assetId={assetId}
                    assetToken={balancesToShow?.token}
                    disabled={!balancesToShow?.reservedBalance || balancesToShow?.reservedBalance?.isZero()}
                    price={currentPrice}
                  />
                </>
              }
            </Grid>
            <Grid container direction='column' gap='15px' item width='300px'>
              {showTotalChart &&
                <TotalChart
                  accountAssets={accountAssets}
                  pricesInCurrency={pricesInCurrency}
                />
              }
              {genesisHash &&
                <CommonTasks
                  address={address}
                  assetId={assetId}
                  balance={balancesToShow as any}
                  genesisHash={genesisHash}
                  setDisplayPopup={setDisplayPopup}
                />
              }
              <AccountSetting
                address={address}
                setDisplayPopup={setDisplayPopup}
              />
              {genesisHash &&
                <ExternalLinks
                  address={address}
                />
              }
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      {displayPopup === popupNumbers.LOCKED_IN_REFERENDA && unlockInformation && api &&
        <LockedInReferenda
          address={address}
          api={api}
          classToUnlock={unlockInformation.classToUnlock}
          setDisplayPopup={setDisplayPopup}
          setRefresh={setRefreshNeeded}
          show={displayPopup === popupNumbers.LOCKED_IN_REFERENDA}
          totalLocked={unlockInformation.totalLocked}
          unlockableAmount={unlockInformation.unlockableAmount}
        />
      }
      {displayPopup === popupNumbers.FORGET_ACCOUNT && account &&
        <ForgetAccountModal
          account={account}
          setDisplayPopup={setDisplayPopup}
        />
      }
      {displayPopup === popupNumbers.RENAME &&
        <RenameModal
          address={address}
          setDisplayPopup={setDisplayPopup}
        />
      }
      {displayPopup === popupNumbers.EXPORT_ACCOUNT &&
        <ExportAccountModal
          address={address}
          setDisplayPopup={setDisplayPopup}
        />
      }
      {displayPopup === popupNumbers.DERIVE_ACCOUNT &&
        <DeriveAccountModal
          parentAddress={address}
          setDisplayPopup={setDisplayPopup}
        />
      }
      {displayPopup === popupNumbers.RECEIVE &&
        <ReceiveModal
          address={address}
          setDisplayPopup={setDisplayPopup}
        />
      }
      {displayPopup === popupNumbers.HISTORY &&
        <HistoryModal
          address={address}
          setDisplayPopup={setDisplayPopup}
        />
      }
    </Grid>
  );
}
