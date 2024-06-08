// Copyright 2019-2024 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable react/jsx-max-props-per-line */

import type { Header } from '@polkadot/types/interfaces';
import type { BN } from '@polkadot/util';
import type { HexString } from '@polkadot/util/types';

import { Grid, SxProps, Theme, Tooltip, useTheme } from '@mui/material';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { ApiPromise } from '@polkadot/api';
import { SubmittableExtrinsic } from '@polkadot/api/types';
import { AccountId } from '@polkadot/types/interfaces/runtime';
import { ISubmittableResult } from '@polkadot/types/types';

import { useAccount, useCanPayFee, useMetadata, useTranslation } from '../hooks';
import { HeaderBrand } from '../partials';
import SelectProxy from '../partials/SelectProxy';
import Qr from '../popup/signing/Qr';
import { CMD_MORTAL } from '../popup/signing/Request';
import { send } from '../util/api';
import { Proxy, ProxyItem, ProxyTypes, TxInfo } from '../util/types';
import { noop } from '../util/utils';
import { Identity, Password, PButton, Popup, Progress, Warning } from '.';

interface Props {
  api: ApiPromise | undefined;
  estimatedFee?: BN;
  confirmDisabled?: boolean;
  confirmText?: string
  disabled?: boolean;
  isPasswordError?: boolean;
  label: string;
  onChange: React.Dispatch<React.SetStateAction<string | undefined>>
  proxiedAddress: string | AccountId | undefined;
  genesisHash: string | undefined;
  prevState?: Record<string, unknown>;
  proxyTypeFilter: ProxyTypes[];
  style?: SxProps<Theme>;
  proxies: ProxyItem[] | undefined
  setSelectedProxy: React.Dispatch<React.SetStateAction<Proxy | undefined>>;
  selectedProxy: Proxy | undefined;
  setIsPasswordError: React.Dispatch<React.SetStateAction<boolean>>;
  onConfirmClick: () => Promise<void>;
  ptx: SubmittableExtrinsic<'promise', ISubmittableResult> | undefined;
  senderAddress: string;
  setTxInfo: (value: React.SetStateAction<TxInfo | undefined>) => void;
  setShowWaitScreen: (value: React.SetStateAction<boolean>) => void;
  setShowConfirmation: (value: React.SetStateAction<boolean>) => void;
  extraInfo: Record<string, unknown>;
}

export default function PasswordUseProxyConfirm({ api, confirmDisabled, confirmText, disabled, estimatedFee, extraInfo, genesisHash, isPasswordError, label = '', onChange, onConfirmClick, prevState, proxiedAddress, proxies, proxyTypeFilter, ptx, selectedProxy, senderAddress, setIsPasswordError, setSelectedProxy, setShowConfirmation, setShowWaitScreen, setTxInfo, style }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const theme = useTheme();
  const canPayFee = useCanPayFee(selectedProxy?.delegate || proxiedAddress, estimatedFee);
  const account = useAccount(proxiedAddress);
  const chain = useMetadata(genesisHash, true);

  const [password, setPassword] = useState<string>();
  const [showSelectProxy, setShowSelectProxy] = useState<boolean>(false);
  const [showQRSigner, setShowQRSigner] = useState<boolean>(false);
  const [lastHeader, setLastHeader] = useState<Header>();
  const [rawNonce, setRawNonce] = useState<number>();

  const mustSelectProxy = useMemo(() => account?.isExternal && !account?.isQR && !selectedProxy, [account, selectedProxy]);
  const mustSelectQR = useMemo(() => account?.isQR && !selectedProxy, [account, selectedProxy]);

  const proxiesToSelect = useMemo(() => proxies?.filter((proxy) => proxy.status !== 'new'), [proxies]);

  const payload = useMemo(() => {
    if (!api || !ptx || !lastHeader || !rawNonce) {
      return;
    }

    try {
      const _payload = {
        address: senderAddress,
        blockHash: lastHeader.hash.toHex(),
        blockNumber: api.registry.createType('BlockNumber', lastHeader.number.toNumber()).toHex(),
        era: api.registry.createType('ExtrinsicEra', { current: lastHeader.number.toNumber(), period: 64 }).toHex(),
        genesisHash: api.genesisHash.toHex(),
        method: api.createType('Call', ptx).toHex(), // TODO: DOES SUPPORT nested calls, batches , ...
        nonce: api.registry.createType('Compact<Index>', rawNonce).toHex(),
        signedExtensions: [
          'CheckNonZeroSender',
          'CheckSpecVersion',
          'CheckTxVersion',
          'CheckGenesis',
          'CheckMortality',
          'CheckNonce',
          'CheckWeight',
          'ChargeTransactionPayment'
        ],
        specVersion: api.runtimeVersion.specVersion.toHex(),
        tip: api.registry.createType('Compact<Balance>', 0).toHex(),
        transactionVersion: api.runtimeVersion.transactionVersion.toHex(),
        version: ptx.version
      };

      return api.registry.createType('ExtrinsicPayload', _payload, { version: _payload.version });
    } catch (error) {
      console.error('Something went wrong when making payload:', error);

      return undefined;
    }
  }, [api, senderAddress, lastHeader, rawNonce, ptx]);

  useEffect((): void => {
    if (api && senderAddress) {
      api.rpc.chain.getHeader().then(setLastHeader).catch(console.error);
      api.query.system.account(senderAddress).then((res) => setRawNonce(res?.nonce || 0)).catch(console.error);
    }
  }, [api, senderAddress]);

  const onSignature = useCallback(async ({ signature }: { signature: HexString }) => {
    if (!api || !payload || !signature || !ptx || !senderAddress) {
      return;
    }

    setShowWaitScreen(true);

    const { block, failureText, fee, success, txHash } = await send(senderAddress, api, ptx, payload, signature);

    const info = {
      block: block || 0,
      chain,
      date: Date.now(),
      failureText,
      fee: fee || String(estimatedFee || 0),
      from: { address: senderAddress, name },
      success,
      txHash: txHash || '',
      ...extraInfo
    };

    setShowWaitScreen(false);
    setShowConfirmation(true);
    setTxInfo({ ...info, api } as TxInfo);
  }, [api, chain, estimatedFee, extraInfo, payload, ptx, senderAddress, setShowConfirmation, setShowWaitScreen, setTxInfo]);

  const _onChange = useCallback((pass: string): void => {
    pass.length > 3 && pass && setPassword(pass);
    pass.length > 3 && pass && setIsPasswordError && setIsPasswordError(false);
  }, [setIsPasswordError]);

  const goToSelectProxy = useCallback((): void => {
    setShowSelectProxy(true);
  }, [setShowSelectProxy]);

  const goToQRSigner = useCallback((): void => {
    setShowQRSigner(true);
  }, []);

  const closeQRSigner = useCallback((): void => {
    setShowQRSigner(false);
  }, []);

  useEffect(() => {
    onChange(password);
  }, [password, onChange]);

  return (
    <>
      <Grid container>
        {mustSelectProxy
          ? <>
            <Grid container item sx={{ bottom: '80px', position: 'absolute' }}>
              <Warning
                fontWeight={300}
                theme={theme}
              >
                {t('This is a watch-only account. To complete this transaction, you must use a proxy.')}
              </Warning>
            </Grid>
            <PButton
              _onClick={goToSelectProxy}
              text={t<string>('Use Proxy')}
            />
          </>
          : mustSelectQR
            ? <>
              <Grid container item sx={{ bottom: '80px', position: 'absolute' }}>
                <Warning
                  fontWeight={300}
                  theme={theme}
                >
                  {t('This is a QR-attached account. To complete this transaction, you need to use your QR-signer.')}
                </Warning>
              </Grid>
              <PButton
                _onClick={goToQRSigner}
                text={t('Use QR-Signer')}
              />
            </>
            : canPayFee === false
              ? <Grid container item sx={{ bottom: '50px', position: 'absolute' }}>
                <Warning
                  fontWeight={300}
                  theme={theme}
                >
                  {t('This account lacks the required available balance to cover the transaction fee.')}
                </Warning>
              </Grid>
              : <>
                <Grid alignItems='center' container sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', ...style }}>
                  <Grid item>
                    <Password
                      disabled={disabled}
                      isError={isPasswordError}
                      isFocused={true}
                      label={label}
                      onChange={_onChange}
                      onEnter={confirmDisabled ? noop : onConfirmClick}
                    />
                  </Grid>
                  {(!!proxiesToSelect?.length || prevState?.selectedProxyAddress) &&
                    <Tooltip
                      arrow
                      componentsProps={{
                        popper: {
                          sx: {
                            '.MuiTooltip-tooltip.MuiTooltip-tooltipPlacementTop.css-18kejt8': {
                              mb: '3px',
                              p: '3px 15px'
                            },
                            '.MuiTooltip-tooltip.MuiTooltip-tooltipPlacementTop.css-1yuxi3g': {
                              mb: '3px',
                              p: '3px 15px'
                            },
                            visibility: selectedProxy ? 'visible' : 'hidden'
                          }
                        },
                        tooltip: {
                          sx: {
                            '& .MuiTooltip-arrow': {
                              color: '#fff',
                              height: '10px'
                            },
                            backgroundColor: '#fff',
                            color: '#000',
                            fontWeight: 400
                          }
                        }
                      }}
                      leaveDelay={300}
                      placement='top-start'
                      title={
                        <>
                          {selectedProxy &&
                            <Identity
                              api={api}
                              chain={chain}
                              formatted={selectedProxy?.delegate}
                              identiconSize={30}
                              showSocial={false}
                              style={{ fontSize: '14px' }}
                            />
                          }
                        </>
                      }
                    >
                      <Grid aria-label='useProxy' item onClick={goToSelectProxy} pl='5px' pt='10px' role='button' sx={{ cursor: 'pointer', fontWeight: 400, textDecorationLine: 'underline' }}>
                        {selectedProxy ? t('Update proxy') : t('Use proxy')}
                      </Grid>
                    </Tooltip>
                  }
                </Grid>
                <PButton
                  _onClick={onConfirmClick}
                  disabled={!password || isPasswordError || confirmDisabled}
                  text={confirmText ?? t<string>('Confirm')}
                />
              </>
        }
      </Grid>
      {showSelectProxy &&
        <SelectProxy
          genesisHash={genesisHash}
          proxiedAddress={proxiedAddress}
          proxies={proxiesToSelect}
          proxyTypeFilter={proxyTypeFilter}
          selectedProxy={selectedProxy}
          setSelectedProxy={setSelectedProxy}
          setShow={setShowSelectProxy}
          show={showSelectProxy}
        />
      }
      {showQRSigner &&
        <Popup show={showQRSigner}>
          <Grid container item>
            <HeaderBrand
              onBackClick={closeQRSigner}
              showBackArrow
              text={t('Sign with QR code')}
            />
            <Grid alignItems='center' container item justifyContent='center' sx={{ '> div': { width: 'inherit' }, pt: '30px' }}>
              {senderAddress && (account?.genesisHash || api?.genesisHash?.toHex()) && payload
                ? <Qr
                  address={senderAddress}
                  buttonLeft='0px'
                  cmd={CMD_MORTAL}
                  genesisHash={account?.genesisHash || api?.genesisHash?.toHex()}
                  onSignature={onSignature}
                  payload={payload}
                />
                : <Progress pt='20px' title={t('API is not connected yet ...')} type='grid' />
              }
            </Grid>
          </Grid>
        </Popup>
      }
    </>
  );
}
