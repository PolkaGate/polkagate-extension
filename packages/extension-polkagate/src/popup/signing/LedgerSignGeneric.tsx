// Copyright 2019-2024 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable react/jsx-max-props-per-line */

import type { HexString } from '@polkadot/util/types';

import { Grid, useTheme } from '@mui/material';
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import styled from 'styled-components';

import { PButton, Warning } from '../../components';
import useTranslation from '../../hooks/useTranslation';
import { useGenericLedger, useInfo, useMetadataProof } from '../../hooks';
import ledgerChains from '../../util/legerChains';

import type { SignerPayloadJSON } from '@polkadot/types/types';
import type { LedgerSignature } from '@polkadot/hw-ledger/types';
import type { GenericExtrinsicPayload } from '@polkadot/types';

interface Props {
  accountIndex?: number;
  address: string | undefined;
  addressOffset?: number;
  className?: string;
  error: string | null;
  onSignature?: (signature: HexString, raw?: GenericExtrinsicPayload) => void;
  payload?: SignerPayloadJSON;
  setError: (value: string | null) => void;
  showError?: boolean;
}

function LedgerSignGeneric({ accountIndex, address, addressOffset, error, onSignature, payload, setError, showError = true }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const theme = useTheme();

  const {api, account} = useInfo(address);
  const metadataProof = useMetadataProof(api, payload);

  const chainSlip44 = useMemo(() => {
    if (account?.genesisHash) {
      return ledgerChains.find(({ genesisHash }) => genesisHash.includes(account.genesisHash as any))?.slip44 ?? null
    }
    return null;
  }, [account, ledgerChains]);

  const { error: ledgerError, isLoading: ledgerLoading, isLocked: ledgerLocked, ledger, refresh, warning: ledgerWarning } = useGenericLedger(accountIndex, addressOffset, chainSlip44);

  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (ledgerError) {
      setError(ledgerError);
    }
  }, [ledgerError, setError]);

  const _onRefresh = useCallback(() => {
    refresh();
    setError(null);
  }, [refresh, setError]);

  const _onSignLedger = useCallback(
    async (): Promise<void> => {
      if (!ledger || !payload || !onSignature || !api || !metadataProof) {
        return;
      }
      const { raw, txMetadata } = metadataProof;


      setError(null);
      setIsBusy(true);

      ledger.signTransaction(raw.toU8a(true), txMetadata, accountIndex, addressOffset)
        .then(({ signature }: LedgerSignature) => {
          onSignature(signature, raw);
        }).catch((e: Error) => {

          setError(e.message);
          setIsBusy(false);
        });
    }, [accountIndex, addressOffset, ledger, onSignature, payload, setError, api, metadataProof]);

  return (
    <Grid container>
      {!!ledgerWarning &&
        <Warning marginTop={0} theme={theme}>
          {ledgerWarning}
        </Warning>
      }
      {error && showError &&
        <Warning isDanger marginTop={0} theme={theme}>
          {error}
        </Warning>
      }
      {ledgerLocked || error
        ? <PButton
          _isBusy={isBusy || !metadataProof}
          _onClick={_onRefresh}
          text={t<string>('Refresh')}
        />
        : <PButton
          _isBusy={isBusy || ledgerLoading}
          _onClick={_onSignLedger}
          text={t<string>('Sign on Ledger')}
        />
      }
    </Grid>
  );
}

export default styled(LedgerSignGeneric)`
  flex-direction: column;
  padding: 6px 24px;

  .danger {
    margin-bottom: .5rem;
  }
`;
