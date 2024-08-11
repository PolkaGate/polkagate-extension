// Copyright 2019-2024 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable react/jsx-max-props-per-line */

import type { ApiPromise } from '@polkadot/api';
import type { SubmittableExtrinsic } from '@polkadot/api/types/submittable';
import type { GenericExtrinsicPayload } from '@polkadot/types';
import type { ISubmittableResult, SignerPayloadJSON } from '@polkadot/types/types';
import type { HexString } from '@polkadot/util/types';
import type { TxResult } from '../util/types';

import { Grid, useTheme } from '@mui/material';
import React, { useCallback, useState } from 'react';

import { useInfo, useTranslation } from '../hooks';
import LedgerSign from '../popup/signing/LedgerSign';
import LedgerSignGeneric from '../popup/signing/LedgerSignGeneric';
import { send } from '../util/api';
import { PButton, Warning } from '.';

interface Props {
  address: string;
  alertText: string | undefined;
  onSecondaryClick: () => void;
  signerPayload: SignerPayloadJSON | undefined;
  onSignature: ({ signature }: { signature: HexString; }) => Promise<void>;
  api: ApiPromise | undefined;
  payload: GenericExtrinsicPayload | undefined;
  from: string | undefined;
  ptx: SubmittableExtrinsic<'promise', ISubmittableResult> | undefined;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  steps: Record<string, number>;
  handleTxResult: (txResult: TxResult) => void
}

export default function SignWithLedger ({ address, alertText, api, from, handleTxResult, onSecondaryClick, onSignature, payload, ptx, setStep, signerPayload, steps }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { account, chainName } = useInfo(address);

  const [error, setError] = useState<string | null>();

  // hope this works for future system chains
  // we have used startWith instead of includes since there is chains like AvN Polkadot !
  const isPolkadotOrItsSystemChains = chainName?.toLowerCase()?.startsWith('polkadot');

  const onLedgerGenericSignature = useCallback(async (signature: HexString, raw?: GenericExtrinsicPayload) => {
    if (!api || !signature || !ptx || !from) {
      return;
    }

    if (!raw) {
      throw new Error('No raw data to send!');
    }

    setStep(steps['WAIT_SCREEN']);

    const txResult = await send(from, api, ptx, raw.toHex(), signature);

    handleTxResult(txResult);
  }, [api, from, handleTxResult, ptx, setStep, steps]);

  return (
    <>
      <Grid alignItems='center' container height='50px' item justifyContent='center' sx={{ '> div': { m: 0, p: 0 }, pt: '5px' }}>
        <Warning
          isDanger={!!error}
          theme={theme}
        >
          {error || alertText}
        </Warning>
      </Grid>
      <Grid container item justifyContent='space-between'>
        <Grid item sx={{ mt: '18px' }} xs={3}>
          <PButton
            _mt='1px'
            _onClick={onSecondaryClick}
            _variant='outlined'
            text={t('Cancel')}
          />
        </Grid>
        <Grid item sx={{ button: { m: 0, width: '100%' }, mt: '80px', position: 'relative', width: '70%' }} xs={8}>
          {account?.isGeneric || account?.isMigration || isPolkadotOrItsSystemChains
            ? <LedgerSignGeneric
              accountIndex={account?.accountIndex || 0}
              address={address}
              addressOffset={account?.addressOffset || 0}
              error={error}
              onSignature={onLedgerGenericSignature}
              payload={signerPayload}
              setError={setError}
              showError={false}
            />
            : <LedgerSign
              accountIndex={account?.accountIndex || 0}
              addressOffset={account?.addressOffset || 0}
              error={error}
              genesisHash={account?.genesisHash || api?.genesisHash?.toHex()}
              onSignature={onSignature}
              payload={payload}
              setError={setError}
              showError={false}
            />
          }
        </Grid>
      </Grid>
    </>
  )
}
