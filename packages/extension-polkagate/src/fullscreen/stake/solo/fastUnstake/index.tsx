// Copyright 2019-2024 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable react/jsx-max-props-per-line */

import type { TxInfo } from '@polkadot/extension-polkagate/src/util/types';
import type { Balance } from '@polkadot/types/interfaces';
import type { StakingInputs } from '../../type';

import { faBolt } from '@fortawesome/free-solid-svg-icons';
import CheckCircleOutlineSharpIcon from '@mui/icons-material/CheckCircleOutlineSharp';
import { Grid, Typography, useTheme } from '@mui/material';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { DraggableModal } from '@polkadot/extension-polkagate/src/fullscreen/governance/components/DraggableModal';
import WaitScreen from '@polkadot/extension-polkagate/src/fullscreen/governance/partials/WaitScreen';
import { getValue } from '@polkadot/extension-polkagate/src/popup/account/util';
import { amountToHuman } from '@polkadot/extension-polkagate/src/util/utils';
import { BN, BN_MAX_INTEGER, BN_ONE, BN_ZERO } from '@polkadot/util';

import { PButton, Progress, Warning } from '../../../../components';
import { useBalances, useInfo, useIsExposed, useStakingAccount, useStakingConsts, useTranslation } from '../../../../hooks';
import Confirmation from '../../partials/Confirmation';
import Review from '../../partials/Review';
import { STEPS } from '../../pool/stake';
import { ModalTitle } from '../commonTasks/configurePayee';
import { MODAL_IDS } from '..';

interface Props {
  address: string | undefined;
  setShow: React.Dispatch<React.SetStateAction<number>>;
  show: boolean;
  setRefresh: React.Dispatch<React.SetStateAction<boolean>>
}

export default function FastUnstake ({ address, setRefresh, setShow, show }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const theme = useTheme();
  const { api, decimal, formatted, token } = useInfo(address);
  const stakingAccount = useStakingAccount(address);
  const myBalances = useBalances(address);
  const stakingConsts = useStakingConsts(address);
  const isExposed = useIsExposed(address);

  const [estimatedFee, setEstimatedFee] = useState<Balance | undefined>();
  const [step, setStep] = useState(STEPS.INDEX);
  const [txInfo, setTxInfo] = useState<TxInfo | undefined>();
  const [inputs, setInputs] = useState<StakingInputs>();

  const redeemable = useMemo(() => stakingAccount?.redeemable, [stakingAccount?.redeemable]);
  const fastUnstakeDeposit = api && (api.consts['fastUnstake']?.['deposit'] as unknown as BN || BN_ZERO);
  const availableBalance = getValue('available', myBalances);
  const hasEnoughDeposit = fastUnstakeDeposit && stakingConsts && myBalances && estimatedFee && availableBalance
    ? new BN(fastUnstakeDeposit).add(estimatedFee).lt(availableBalance || BN_MAX_INTEGER)
    : undefined;

  const hasUnlockingAndRedeemable = redeemable && stakingAccount
    ? !!(!redeemable.isZero() || stakingAccount.unlocking?.length)
    : undefined;

  const isEligible = isExposed !== undefined && hasUnlockingAndRedeemable !== undefined && hasEnoughDeposit !== undefined
    ? !isExposed && !hasUnlockingAndRedeemable && hasEnoughDeposit
    : undefined;

  const staked = useMemo(() => stakingAccount?.stakingLedger?.active as BN | undefined, [stakingAccount]);

  useEffect(() => {
    if (!api || !staked || !availableBalance) {
      return;
    }

    const call = api.tx['fastUnstake']['registerFastUnstake'];
    const availableBalanceAfter = availableBalance.add(staked);

    const params: never[] = [];

    const extraInfo = {
      action: 'Solo Staking',
      amount: amountToHuman(staked, decimal),
      availableBalanceAfter,
      subAction: 'Fast Unstake'
    };

    setInputs({
      call,
      extraInfo,
      params
    });
  }, [api, availableBalance, decimal, myBalances, staked]);

  useEffect((): void => {
    if (!api) {
      return;
    }

    if (!api?.call?.['transactionPaymentApi']) {
      return setEstimatedFee(api?.createType('Balance', BN_ONE) as Balance);
    }

    inputs?.call && address && inputs.call().paymentInfo(address).then((i) => setEstimatedFee(i?.partialFee)).catch(console.error);
  }, [api, address, inputs, formatted]);

  const onNext = useCallback(() => {
    setStep(STEPS.REVIEW);
  }, []);

  const onCancel = useCallback(() => {
    setStep(STEPS.INDEX);
    setShow(MODAL_IDS.NONE);
  }, [setShow]);

  const goTo = useCallback(() => {
    isEligible === true && onNext();
    !isEligible && onCancel();
  }, [isEligible, onCancel, onNext]);

  const NumberPassFail = ({ condition, no }: { condition: boolean | undefined, no: number }) => (
    condition
      ? <CheckCircleOutlineSharpIcon sx={{ bgcolor: 'success.main', borderRadius: '50%', color: '#fff', fontSize: '20px', ml: '-1px' }} />
      : <Typography fontSize='13px' sx={{ bgcolor: condition === undefined ? 'action.disabledBackground' : 'warning.main', border: '1px solid', borderColor: '#fff', borderRadius: '50%', color: 'white', height: '18px', lineHeight: 1.4, textAlign: 'center', width: '18px' }}>
        {no}
      </Typography>
  );

  return (
    <DraggableModal minHeight={615} onClose={onCancel} open={show}>
      <Grid container>
        {step !== STEPS.WAIT_SCREEN &&
          <ModalTitle
            icon={faBolt}
            onCancel={onCancel}
            setStep={setStep}
            step={step}
            text={t('Fast Unstake')}
          />
        }
        {step === STEPS.INDEX &&
          <>
            <Grid container item>
              <Grid container direction='column' m='20px auto' width='90%'>
                <Typography fontSize='16px'>
                  {t('Checking fast unstake eligibility')}:
                </Typography>
                <Grid alignItems='center' container item lineHeight='28px' pl='5px' pt='25px'>
                  <NumberPassFail condition={hasEnoughDeposit} no={1} />
                  <Typography fontSize='14px' lineHeight='inherit' pl='5px'>
                    {t('Having {{deposit}} {{token}} available to deposit', { replace: { deposit: fastUnstakeDeposit && decimal ? amountToHuman(fastUnstakeDeposit, decimal) : t('some'), token } })}
                  </Typography>
                </Grid>
                <Grid alignItems='center' container item lineHeight='28px' pl='5px'>
                  <NumberPassFail condition={hasUnlockingAndRedeemable === undefined ? undefined : hasUnlockingAndRedeemable === false} no={2} />
                  <Typography fontSize='14px' lineHeight='inherit' pl='5px'>
                    {t('No redeemable or unstaking funds')}
                  </Typography>
                </Grid>
                <Grid alignItems='center' container item lineHeight='28px' pl='5px'>
                  <NumberPassFail condition={isExposed === undefined ? undefined : isExposed === false} no={3} />
                  <Typography fontSize='14px' lineHeight='inherit' pl='5px'>
                    {t('Not being rewarded in the past {{unbondingDuration}} {{day}}', { replace: { unbondingDuration: stakingConsts?.unbondingDuration || '...', day: stakingConsts?.unbondingDuration && stakingConsts.unbondingDuration > 1 ? 'days' : 'day' } })}
                  </Typography>
                </Grid>
              </Grid>
              {isEligible === undefined &&
                <Progress pt={'60px'} size={115} title={t('Please wait a few seconds and don\'t close the window.')} type='grid' />
              }
              <Grid bottom='70px' item position='absolute'>
                {isEligible !== undefined &&
                  <Warning
                    fontSize='15px'
                    isDanger={isEligible === false}
                    theme={theme}
                  >
                    {isEligible === true
                      ? t('You can proceed to do fast unstake. Note your stake amount will be available within a few minutes after submitting the transaction.')
                      : isEligible === false &&
                      t('This account is not eligible for fast unstake, because the requirements (highlighted above) are not met.')}
                  </Warning>
                }
              </Grid>
            </Grid>
            <PButton
              _ml={0}
              _onClick={goTo}
              _variant={isEligible ? 'contained' : 'outlined'}
              _width={87}
              disabled={!inputs}
              text={isEligible ? t('Next') : t('Back')}
            />
          </>
        }
        {[STEPS.REVIEW, STEPS.PROXY, STEPS.SIGN_QR].includes(step) &&
          <Review
            address={address}
            inputs={inputs}
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
            handleDone={onCancel}
            txInfo={txInfo}
          />
        }
      </Grid>
    </DraggableModal>
  );
}
