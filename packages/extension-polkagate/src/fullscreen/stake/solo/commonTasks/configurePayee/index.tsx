// Copyright 2019-2024 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable react/jsx-max-props-per-line */

import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import type { SxProps } from '@mui/material';
import type { AccountStakingInfo, Payee, SoloSettings, TxInfo } from '@polkadot/extension-polkagate/src/util/types';
import type { StakingInputs } from '../../../type';

import { faHandHoldingDollar } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Close as CloseIcon } from '@mui/icons-material';
import { Divider, FormControl, FormControlLabel, FormLabel, Grid, IconButton, Radio, RadioGroup, Skeleton, Typography, useTheme } from '@mui/material';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { DraggableModal } from '@polkadot/extension-polkagate/src/fullscreen/governance/components/DraggableModal';
import WaitScreen from '@polkadot/extension-polkagate/src/fullscreen/governance/partials/WaitScreen';
import { amountToHuman, upperCaseFirstChar } from '@polkadot/extension-polkagate/src/util/utils';

import { AccountInputWithIdentity, TwoButtons, Warning } from '../../../../../components';
import { useInfo, useStakingAccount, useStakingConsts, useTranslation } from '../../../../../hooks';
import Confirmation from '../../../partials/Confirmation';
import Review from '../../../partials/Review';
import { STEPS } from '../../../pool/stake';

interface Props {
  address: string | undefined;
  setShow: React.Dispatch<React.SetStateAction<boolean>>;
  show: boolean;
  setRefresh: React.Dispatch<React.SetStateAction<boolean>>
}

export const ModalTitle = ({ icon, onCancel, setStep, step, text }: { text: string, onCancel: () => void, setStep?: React.Dispatch<React.SetStateAction<number>>, icon: IconDefinition, step: number }): React.ReactElement<Props> => {
  const theme = useTheme();
  const { t } = useTranslation();

  const closeProxy = useCallback(
    () => setStep && setStep(STEPS.REVIEW)
    , [setStep]);

  const onClose = useCallback(() => {
    setStep && setStep(STEPS.INDEX);
  }, [setStep]);

  return (
    <Grid alignItems='center' container justifyContent='space-between' pt='5px'>
      <Grid alignItems='center' container justifyContent='flex-start' sx={{ width: 'fit-content' }}>
        <Grid item>
          <FontAwesomeIcon
            color={`${theme.palette.text.primary}`}
            fontSize='25px'
            icon={icon}
          />
        </Grid>
        <Grid item sx={{ pl: '10px' }}>
          <Typography fontSize='18px' fontWeight={700}>
            {step === STEPS.PROXY ? t('Select Proxy') : text}
          </Typography>
        </Grid>
      </Grid>
      <Grid item>
        <IconButton
          onClick={
            step === STEPS.INDEX
              ? onCancel
              : step === STEPS.PROXY
                ? closeProxy
                : onClose
          }
        >
          <CloseIcon sx={{ color: 'primary.main', cursor: 'pointer', stroke: theme.palette.primary.main, strokeWidth: 1.5 }} />
        </IconButton>
      </Grid>
      <Divider sx={{ mt: '5px', width: '100%' }} />
    </Grid>
  );
};

export default function ConfigurePayee ({ address, setRefresh, setShow, show }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const theme = useTheme();
  const { api, chain, decimal, token } = useInfo(address);

  const stakingConsts = useStakingConsts(address);
  const stakingAccount = useStakingAccount(address, undefined, undefined, undefined, true);

  const [rewardDestinationValue, setRewardDestinationValue] = useState<string>();
  const [rewardDestinationAccount, setRewardDestinationAccount] = useState<string | undefined>();
  const [newPayee, setNewPayee] = useState<Payee>();
  const [step, setStep] = useState(STEPS.INDEX);
  const [txInfo, setTxInfo] = useState<TxInfo | undefined>();
  const [inputs, setInputs] = useState<StakingInputs>();

  const settings = useMemo(() => {
    if (!stakingAccount) {
      return;
    }

    // initialize settings
    const parsedStakingAccount = JSON.parse(JSON.stringify(stakingAccount)) as AccountStakingInfo;

    /** in Westend it is null recently if user has not staked yet */
    if (!parsedStakingAccount.rewardDestination) {
      return;
    }

    const destinationType = Object.keys(parsedStakingAccount.rewardDestination)[0];

    let payee: Payee;

    if (destinationType === 'account') {
      // @ts-ignore
      const rewardDestinationAccount = parsedStakingAccount.rewardDestination.account as string;

      payee = {
        Account: rewardDestinationAccount
      };

      setRewardDestinationAccount(rewardDestinationAccount);
    } else {
      payee = upperCaseFirstChar(destinationType) as Payee;

      if (payee === 'Stash') {
        setRewardDestinationAccount(parsedStakingAccount.stashId.toString());
      }
    }

    setRewardDestinationValue(payee === 'Staked' ? 'Staked' : 'Others');

    return ({ payee, stashId: parsedStakingAccount.stashId as unknown as string });
  }, [stakingAccount]);

  const getOptionLabel = useCallback((s: SoloSettings): 'Staked' | 'Others' => s?.payee === 'Staked' ? 'Staked' : 'Others', []);
  const optionDefaultVal = useMemo(() => settings && getOptionLabel(settings), [getOptionLabel, settings]);

  const setPayee = api?.tx['staking']['setPayee'];

  useEffect(() => {
    if (!setPayee || !api || !address || !newPayee) {
      return;
    }

    const call = setPayee;
    const params = [newPayee];

    const extraInfo = {
      action: 'Solo Staking',
      payee: newPayee,
      subAction: 'Config reward destination'
    };

    setInputs({
      call,
      extraInfo,
      params
    });
  }, [address, api, newPayee, setPayee]);

  const ED = useMemo(() => stakingConsts?.existentialDeposit && decimal && amountToHuman(stakingConsts.existentialDeposit, decimal), [decimal, stakingConsts?.existentialDeposit]);

  const onSelectionMethodChange = useCallback((_event: React.ChangeEvent<HTMLInputElement>, value: string): void => {
    // value:'Staked' | 'Others'
    setRewardDestinationValue(value);

    if (value === 'Staked') {
      setRewardDestinationAccount(undefined);// to reset
    }
  }, []);

  const makePayee = useCallback((value: string, account?: string) => {
    // value: 'Staked' | 'Others'
    if (!settings) {
      return;
    }

    if (value === 'Staked') {
      return 'Staked';
    }

    if (account === settings?.stashId?.toString()) {
      return 'Stash';
    }

    if (account) {
      return { Account: account };
    }

    return undefined;
  }, [settings]);

  const payeeNotChanged = useMemo(
    () =>
      settings && rewardDestinationValue && JSON.stringify(settings.payee) === JSON.stringify(makePayee(rewardDestinationValue, rewardDestinationAccount))
    , [makePayee, rewardDestinationAccount, rewardDestinationValue, settings]);

  useEffect(() => {
    if (!rewardDestinationValue || !settings) {
      return;
    }

    const mayBeNew = makePayee(rewardDestinationValue, rewardDestinationAccount);
    const payee = mayBeNew && JSON.stringify(settings.payee) !== JSON.stringify(mayBeNew) ? mayBeNew : undefined;

    setNewPayee(payee);
  }, [makePayee, rewardDestinationAccount, rewardDestinationValue, settings]);

  const onNext = useCallback(() => {
    setStep(STEPS.REVIEW);
  }, []);

  const onCancel = useCallback(() => {
    setStep(STEPS.INDEX);
    setShow(false);
  }, [setShow]);

  const Warn = ({ style = {}, text }: { text: string, style?: SxProps }) => (
    <Grid container justifyContent='center' sx={style}>
      <Warning
        fontWeight={400}
        theme={theme}
      >
        {text}
      </Warning>
    </Grid>
  );

  return (
    <DraggableModal onClose={onCancel} open={show}>
      <>
        {step !== STEPS.WAIT_SCREEN &&
          <ModalTitle
            icon={faHandHoldingDollar}
            onCancel={onCancel}
            setStep={setStep}
            step={step}
            text={t('Configuring Reward Destination')}
          />
        }
        {step === STEPS.INDEX &&
          <>
            <Grid container item>
              <Grid container item justifyContent='flex-start' mt='35px' mx='15px' width='100%'>
                <FormControl sx={{ textAlign: 'left' }}>
                  <FormLabel sx={{ '&.Mui-focused': { color: 'text.primary' }, color: 'text.primary', fontSize: '16px' }}>
                    {t('Reward destination')}
                  </FormLabel>
                  {rewardDestinationValue || optionDefaultVal
                    ? <RadioGroup defaultValue={rewardDestinationValue || optionDefaultVal} onChange={onSelectionMethodChange}>
                      <FormControlLabel control={<Radio size='small' sx={{ color: 'secondary.main' }} value='Staked' />} label={<Typography sx={{ fontSize: '18px' }}>{t('Add to staked amount')}</Typography>} />
                      <FormControlLabel control={<Radio size='small' sx={{ color: 'secondary.main', py: '2px' }} value='Others' />} label={<Typography sx={{ fontSize: '18px' }}>{t('Transfer to a specific account')}</Typography>} />
                    </RadioGroup>
                    : <Skeleton
                      animation='wave'
                      height={20}
                      sx={{ display: 'inline-block', fontWeight: 'bold', transform: 'none', width: '200px', mt: '10px' }}
                    />
                  }
                </FormControl>
              </Grid>
              {rewardDestinationValue === 'Others' &&
                <>
                  <AccountInputWithIdentity
                    address={rewardDestinationAccount}
                    chain={chain}
                    label={t('Specific account')}
                    // @ts-ignore
                    setAddress={setRewardDestinationAccount}
                    style={{ pt: '25px', px: '15px' }}
                  />
                  <Warn style={{ mt: '-20px' }} text={t('The balance for the recipient must be at least {{ED}} in order to keep the amount.', { replace: { ED: `${ED} ${token}` } })} />
                </>
              }
            </Grid>
            <TwoButtons
              disabled={payeeNotChanged || (rewardDestinationValue === 'Others' && !rewardDestinationAccount)}
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
      </>
    </DraggableModal>
  );
}
