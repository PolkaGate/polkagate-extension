// Copyright 2019-2024 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable react/jsx-max-props-per-line */

import type { TxInfo } from '@polkadot/extension-polkagate/src/util/types';
import type { Balance } from '@polkadot/types/interfaces';
import type { StakingInputs } from '../../type';

import { faMinus } from '@fortawesome/free-solid-svg-icons';
import { Grid, Typography, useTheme } from '@mui/material';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { DraggableModal } from '@polkadot/extension-polkagate/src/fullscreen/governance/components/DraggableModal';
import WaitScreen from '@polkadot/extension-polkagate/src/fullscreen/governance/partials/WaitScreen';
import Asset from '@polkadot/extension-polkagate/src/partials/Asset';
import ShowPool from '@polkadot/extension-polkagate/src/popup/staking/partial/ShowPool';
import { MAX_AMOUNT_LENGTH } from '@polkadot/extension-polkagate/src/util/constants';
import { amountToHuman, amountToMachine } from '@polkadot/extension-polkagate/src/util/utils';
import { BN, BN_ONE, BN_ZERO } from '@polkadot/util';

import { AmountWithOptions, TwoButtons, Warning } from '../../../../components';
import { useInfo, usePool, usePoolConsts, useTranslation } from '../../../../hooks';
import Confirmation from '../../partials/Confirmation';
import Review from '../../partials/Review';
import { ModalTitle } from '../../solo/commonTasks/configurePayee';
import { STEPS } from '../stake';
import { MODAL_IDS } from '..';

interface Props {
  address: string | undefined;
  setShow: React.Dispatch<React.SetStateAction<number>>;
  show: boolean;
  setRefresh: React.Dispatch<React.SetStateAction<boolean>>
}

export default function Unstake ({ address, setRefresh, setShow, show }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const theme = useTheme();
  const { api, chain, decimal, formatted, token } = useInfo(address);
  const myPool = usePool(address, undefined);
  const poolConsts = usePoolConsts(address);

  const [step, setStep] = useState(STEPS.INDEX);
  const [txInfo, setTxInfo] = useState<TxInfo | undefined>();
  const [inputs, setInputs] = useState<StakingInputs>();
  const [estimatedFee, setEstimatedFee] = useState<Balance | undefined>();
  const [amountAsBN, setAmountAsBN] = useState<BN>();
  const [amount, setAmount] = useState<string | undefined>();

  const [alert, setAlert] = useState<string | undefined>();
  const [unstakeMaxAmount, setUnstakeMaxAmount] = useState<boolean>(false);

  const staked = useMemo(() => {
    if (myPool?.member?.points && myPool.stashIdAccount && myPool.bondedPool) {
      const myPoints = new BN(myPool.member.points);
      const poolActive = new BN(String(myPool.stashIdAccount.stakingLedger.active));
      const poolPoints = new BN(myPool.bondedPool.points);

      return myPoints.isZero() || poolPoints.isZero()
        ? BN_ZERO
        : myPoints.mul(poolActive).div(poolPoints);
    } else {
      return BN_ZERO;
    }
  }, [myPool]);

  const totalStakeAfter = useMemo(() => {
    if (unstakeMaxAmount || !amountAsBN) {
      return BN_ZERO;
    }

    if (staked && !unstakeMaxAmount) {
      return staked.sub(amountAsBN);
    }

    return undefined;
  }, [amountAsBN, staked, unstakeMaxAmount]);

  const unlockingLen = myPool?.stashIdAccount?.stakingLedger?.unlocking?.length;
  const maxUnlockingChunks = api?.consts['staking']['maxUnlockingChunks']?.toPrimitive() as unknown as number;
  const isPoolRoot = useMemo(() => String(formatted) === String(myPool?.bondedPool?.roles?.root), [formatted, myPool?.bondedPool?.roles?.root]);
  const isPoolDepositor = useMemo(() => String(formatted) === String(myPool?.bondedPool?.roles?.depositor), [formatted, myPool?.bondedPool?.roles?.depositor]);
  const poolState = useMemo(() => String(myPool?.bondedPool?.state), [myPool?.bondedPool?.state]);
  const poolMemberCounter = useMemo(() => Number(myPool?.bondedPool?.memberCounter), [myPool?.bondedPool?.memberCounter]);

  const unbonded = api?.tx['nominationPools']['unbond'];
  const poolWithdrawUnbonded = api?.tx['nominationPools']['poolWithdrawUnbonded'];

  const helperText = useMemo(() => {
    if (!myPool || !formatted || !amountAsBN || !staked) {
      return undefined;
    }

    const partial = staked.sub(amountAsBN);

    if (isPoolDepositor && isPoolRoot && poolState !== 'Destroying' && partial.isZero()) {
      return t('You need to change the pool state to Destroying first to be able to unstake.');
    }

    if (isPoolDepositor && isPoolRoot && poolState === 'Destroying' && poolMemberCounter !== 1 && partial.isZero()) {
      return t('You need to remove all members first to be able to unstake.');
    }

    return undefined;
  }, [amountAsBN, formatted, isPoolDepositor, isPoolRoot, myPool, poolMemberCounter, poolState, staked, t]);

  useEffect(() => {
    if (!amountAsBN) {
      setAlert(undefined);

      return;
    }

    if (amountAsBN.gt(staked ?? BN_ZERO)) {
      return setAlert(t('It is more than already staked.'));
    }

    if (isPoolDepositor && (poolMemberCounter > 1 || poolState !== 'Destroying') && poolConsts && staked.sub(amountAsBN).lt(poolConsts.minCreateBond)) {
      return setAlert(t('Remaining stake amount should not be less than {{min}} {{token}}', { replace: { min: amountToHuman(poolConsts.minCreateBond, decimal), token } }));
    }

    if (api && staked && poolConsts && !staked.sub(amountAsBN).isZero() && !unstakeMaxAmount && staked.sub(amountAsBN).lt(poolConsts.minJoinBond)) {
      const remained = api.createType('Balance', staked.sub(amountAsBN)).toHuman();
      const min = api.createType('Balance', poolConsts.minJoinBond).toHuman();

      return setAlert(t('Remaining stake amount ({{remained}}) should not be less than {{min}}.', { replace: { min, remained } }));
    }

    setAlert(undefined);
  }, [amountAsBN, api, poolConsts, decimal, staked, t, unstakeMaxAmount, isPoolDepositor, poolMemberCounter, poolState, token]);

  useEffect(() => {
    if (!api || !formatted || !unbonded || !amountAsBN) {
      return;
    }

    const params = [formatted, amountAsBN];

    if (!api?.call?.['transactionPaymentApi']) {
      return setEstimatedFee(api?.createType('Balance', BN_ONE) as Balance);
    }

    poolWithdrawUnbonded && maxUnlockingChunks && unlockingLen !== undefined &&
      unbonded(...params).paymentInfo(formatted).then((i) => {
        const fee = i?.partialFee;

        if (unlockingLen < maxUnlockingChunks) {
          setEstimatedFee(fee);
        } else {
          const dummyParams = [1, 1];

          poolWithdrawUnbonded(...dummyParams)
            .paymentInfo(formatted)
            .then(
              (j) => setEstimatedFee(api.createType('Balance', fee.add(j?.partialFee || BN_ZERO)) as Balance)
            )
            .catch(console.error);
        }
      }).catch(console.error);
  }, [amountAsBN, api, decimal, formatted, maxUnlockingChunks, poolWithdrawUnbonded, unbonded, unlockingLen]);

  const onChangeAmount = useCallback((value: string) => {
    setUnstakeMaxAmount(false);

    if (decimal && value.length > decimal - 1) {
      console.log(`The amount digits is more than decimal:${decimal}`);

      return;
    }

    setAmountAsBN(amountToMachine(value.slice(0, MAX_AMOUNT_LENGTH), decimal));
    setAmount(value.slice(0, MAX_AMOUNT_LENGTH));
  }, [decimal]);

  const onMaxAmount = useCallback(() => {
    if (!decimal || !myPool || !formatted || !poolConsts || !staked || staked.isZero()) {
      return;
    }

    if ((isPoolRoot || isPoolDepositor) && poolState === 'Destroying' && poolMemberCounter === 1) {
      setUnstakeMaxAmount(true);
      setAmountAsBN(staked);
      setAmount(amountToHuman(staked, decimal));

      return;
    }

    if (isPoolDepositor && (poolState !== 'Destroying' || poolMemberCounter !== 1)) {
      const partial = staked.sub(poolConsts.minCreateBond);

      setUnstakeMaxAmount(false);

      if (partial.isNeg()) { // This rare condition occurs only for old stakers who staked before the poolConsts.minCreateBond value was updated.
        setAmountAsBN(staked);
        setAmount(amountToHuman(staked, decimal));

        return;
      }

      if (!partial.isZero()) {
        setAmountAsBN(partial);
        setAmount(amountToHuman(partial, decimal));
      }

      return;
    }

    if (!isPoolDepositor && !isPoolRoot) {
      setUnstakeMaxAmount(true);
      setAmountAsBN(staked);
      setAmount(amountToHuman(staked, decimal));
    }
  }, [decimal, formatted, isPoolDepositor, isPoolRoot, myPool, poolConsts, poolMemberCounter, poolState, staked]);

  useEffect(() => {
    const handleInput = async () => {
      if (amountAsBN && api && maxUnlockingChunks && unlockingLen !== undefined && poolConsts && myPool?.poolId && unbonded && poolWithdrawUnbonded) {
        const batch = api.tx['utility']['batchAll'];

        const unbondedParams = [formatted, amountAsBN];

        const optSpans = await api.query['staking']['slashingSpans'](formatted) as any;
        const spanCount = optSpans.isNone ? 0 : optSpans.unwrap().prior.length + 1 as number;
        const poolId = myPool.poolId;

        const poolWithdrawUnbondedParams = [poolId, spanCount];

        const call = unlockingLen > maxUnlockingChunks ? batch : unbonded;
        const params = unlockingLen > maxUnlockingChunks
          ? [unbonded(...unbondedParams), poolWithdrawUnbonded(...poolWithdrawUnbondedParams)]
          : unbondedParams;

        const extraInfo = {
          action: 'Pool Staking',
          amount: amountToHuman(amountAsBN, decimal),
          subAction: 'unstake',
          totalStakeAfter
        };

        setInputs({
          call,
          extraInfo,
          params
        });
      }
    };

    handleInput().catch(console.error);
  }, [amountAsBN, api, decimal, formatted, isPoolDepositor, isPoolRoot, maxUnlockingChunks, myPool?.poolId, poolConsts, poolWithdrawUnbonded, staked, totalStakeAfter, unbonded, unlockingLen, unstakeMaxAmount]);

  const Warn = ({ belowInput, iconDanger, isDanger, text }: { belowInput?: boolean, text: string; isDanger?: boolean; iconDanger?: boolean; }) => (
    <Grid container sx={{ '> div': { mr: '0', mt: '5px', pl: '5px' }, mt: isDanger ? '15px' : 0 }}>
      <Warning
        fontWeight={400}
        iconDanger={iconDanger}
        isBelowInput={belowInput}
        isDanger={isDanger}
        theme={theme}
      >
        {text}
      </Warning>
    </Grid>
  );

  const onCancel = useCallback(() => {
    setStep(STEPS.INDEX);
    setShow(MODAL_IDS.NONE);
  }, [setShow]);

  const onNext = useCallback(() => {
    setStep(STEPS.REVIEW);
  }, []);

  return (
    <DraggableModal minHeight={615} onClose={onCancel} open={show}>
      <Grid container>
        {step !== STEPS.WAIT_SCREEN &&
          <ModalTitle
            icon={faMinus}
            onCancel={onCancel}
            setStep={setStep}
            step={step}
            text={t('Unstake')}
          />
        }
        {step === STEPS.INDEX &&
          <>
            {helperText &&
              <Grid container height='78px' justifyContent='center' m='auto' width='92%'>
                <Warn isDanger text={helperText} />
              </Grid>
            }
            <Grid item sx={{ mx: '15px' }} xs={12}>
              <Asset
                address={address}
                api={api}
                balance={staked}
                balanceLabel={t('Staked')}
                fee={estimatedFee}
                style={{
                  m: '20px auto'
                }}
              />
              <AmountWithOptions
                label={t('Amount ({{token}})', { replace: { token } })}
                onChangeAmount={onChangeAmount}
                onPrimary={onMaxAmount}
                primaryBtnText={t('Max amount')}
                value={amount}
              />
              {alert &&
                <Warn belowInput iconDanger text={alert} />
              }
            </Grid>
            {myPool &&
              <ShowPool
                api={api}
                chain={chain as any}
                label={t('Pool')}
                mode='Default'
                pool={myPool}
                showInfo
                style={{
                  m: '15px auto 0',
                  width: '92%'
                }}
              />
            }
            {!helperText &&
              <Typography fontSize='14px' m='20px auto' textAlign='center'>
                {t('Outstanding rewards automatically withdrawn after transaction')}
              </Typography>
            }
            <TwoButtons
              disabled={!inputs || !!helperText || !!alert || amountAsBN?.isZero()}
              ml='0'
              onPrimaryClick={onNext}
              onSecondaryClick={onCancel}
              primaryBtnText={t('Next')}
              secondaryBtnText={t('Cancel')}
              width='87%'
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
