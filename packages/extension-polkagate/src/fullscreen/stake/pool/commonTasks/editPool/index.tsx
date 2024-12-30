// Copyright 2019-2024 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable react/jsx-max-props-per-line */

import type { ApiPromise } from '@polkadot/api';
import type { Chain } from '@polkadot/extension-chains/types';
import type { MyPoolInfo, TxInfo } from '../../../../../util/types';

import { faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import React, { useState } from 'react';

import { DraggableModal } from '@polkadot/extension-polkagate/src/fullscreen/governance/components/DraggableModal';
import WaitScreen from '@polkadot/extension-polkagate/src/fullscreen/governance/partials/WaitScreen';

import { useFormatted, useTranslation } from '../../../../../hooks';
import { ModalTitle } from '../../../solo/commonTasks/configurePayee';
import Confirmation from '../../partials/Confirmation';
import { STEPS } from '../../stake';
import Edit from './Edit';
import Review from './Review';
import TxDetail from './TxDetail';

interface Props {
  address: string;
  api: ApiPromise | undefined;
  chain: Chain | null | undefined;
  onClose: () => void;
  pool: MyPoolInfo;
  setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface ChangesProps {
  commission: {
    payee: string | undefined | null;
    value: number | undefined | null;
  },
  newPoolName: string | undefined | null;
  newRoles: {
    newRoot: string | undefined | null;
    newNominator: string | undefined | null;
    newBouncer: string | undefined | null;
  } | undefined
}

function ManageEditPool ({ address, api, chain, onClose, pool, setRefresh }: Props): React.ReactElement {
  const { t } = useTranslation();
  const formatted = useFormatted(address);

  const [step, setStep] = useState<number>(STEPS.INDEX);
  const [txInfo, setTxInfo] = useState<TxInfo | undefined>();
  const [changes, setChanges] = useState<ChangesProps | undefined>();

  return (
    <>
      <DraggableModal minHeight={600} onClose={onClose} open>
        <>
          {step !== STEPS.WAIT_SCREEN &&
            <ModalTitle
              icon={faPenToSquare}
              onCancel={onClose}
              setStep={setStep}
              step={step}
              text={t('Edit Pool')}
            />
          }
          {step === STEPS.INDEX &&
            <Edit
              api={api}
              chain={chain as any}
              changes={changes}
              onClose={onClose}
              pool={pool}
              setChanges={setChanges}
              setStep={setStep}
            />
          }
          {[STEPS.REVIEW, STEPS.PROXY, STEPS.SIGN_QR].includes(step) &&
            <Review
              address={address}
              api={api}
              chain={chain as any}
              changes={changes}
              formatted={String(formatted)}
              pool={pool}
              setRefresh={setRefresh}
              setStep={setStep}
              setTxInfo={setTxInfo}
              step={step}
            />
          }
          {step === STEPS.WAIT_SCREEN &&
            <WaitScreen />
          }
          {step === STEPS.CONFIRM && txInfo &&
            <Confirmation
              handleClose={onClose}
              popupHeight={670}
              txInfo={txInfo}
            >
              <TxDetail
                changes={changes}
                txInfo={txInfo}
              />
            </Confirmation>
          }
        </>
      </DraggableModal>
    </>
  );
}

export default React.memo(ManageEditPool);
