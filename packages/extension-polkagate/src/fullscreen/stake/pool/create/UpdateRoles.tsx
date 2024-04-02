// Copyright 2019-2024 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable react/jsx-max-props-per-line */

import { Close as CloseIcon } from '@mui/icons-material';
import { Divider, Grid, IconButton, Slide, Typography, useTheme } from '@mui/material';
import { Chain } from '@substrate/connect';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';

import { AccountContext, AddressInput, PButton } from '../../../../components';
import { useTranslation } from '../../../../hooks';
import getAllAddresses from '../../../../util/getAllAddresses';
import { DraggableModal } from '../../../governance/components/DraggableModal';

interface Props {
  address: string;
  chain?: Chain;
  formatted?: string;
  nominatorId: string | undefined;
  bouncerId: string | undefined;
  setNominatorId: React.Dispatch<React.SetStateAction<string | undefined>>;
  setBouncerId: React.Dispatch<React.SetStateAction<string | undefined>>;
  show: boolean;
  setShow: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function UpdateRoles ({ address, bouncerId, chain, nominatorId, setBouncerId, setNominatorId, setShow, show }: Props): React.ReactElement {
  const containerRef = useRef(null);
  const theme = useTheme();
  const { t } = useTranslation();
  const { accounts, hierarchy } = useContext(AccountContext);
  const [updateBtnDisable, setUpdateBtnDisable] = useState<boolean>(false);
  const [newNominatorId, setNewNominatorId] = useState<string | null | undefined>(nominatorId);
  const [newBouncerId, setNewBouncerId] = useState<string | null | undefined>(bouncerId);

  const allAddresses = getAllAddresses(hierarchy, true, true, chain?.ss58Format, address);

  const closeMenu = useCallback(() => {
    setShow(!show);
  }, [setShow, show]);

  const onUpdateRoles = useCallback(() => {
    if (!newNominatorId || !newBouncerId) {
      return;
    }

    setNominatorId(newNominatorId);
    setBouncerId(newBouncerId);
    setShow(!show);
  }, [newNominatorId, newBouncerId, setNominatorId, setShow, setBouncerId, show]);

  useEffect(() => {
    setUpdateBtnDisable(!newNominatorId || !newBouncerId || (newBouncerId === bouncerId && newNominatorId === nominatorId));
  }, [newNominatorId, newBouncerId, nominatorId, bouncerId]);

  return (
    <DraggableModal onClose={show} open>
      <Grid alignItems='flex-start' bgcolor='background.default' container display='block' item mt='46px' px='10px' sx={{ borderRadius: '10px 10px 0px 0px' }} width='100%'>
        <Grid container justifyContent='center' mb='0' my='20px'>
          <Typography fontSize='20px' fontWeight={400}>
            {t<string>('Update Roles')}
          </Typography>
          <Divider sx={{ bgcolor: 'secondary.light', height: '1px', m: '30px auto 5px', width: '80%' }} />
        </Grid>
        <AddressInput
          address={newNominatorId}
          allAddresses={allAddresses}
          chain={chain}
          label={t<string>('Nominator')}
          setAddress={setNewNominatorId}
          showIdenticon
          style={{
            m: '15px auto 0',
            width: '92%'
          }}
        />
        <AddressInput
          address={newBouncerId}
          allAddresses={allAddresses}
          chain={chain}
          label={t<string>('Bouncer')}
          setAddress={setNewBouncerId}
          showIdenticon
          style={{
            m: '15px auto 0',
            width: '92%'
          }}
        />
        <Grid container item>
          <PButton
            _ml={0}
            _onClick={onUpdateRoles}
            _width={84}
            disabled={updateBtnDisable}
            text={t<string>('Update')}
          />
        </Grid>
        <IconButton
          onClick={closeMenu}
          sx={{
            left: '15px',
            p: 0,
            position: 'absolute',
            top: '65px'
          }}
        >
          <CloseIcon sx={{ color: 'text.primary', fontSize: 35 }} />
        </IconButton>
      </Grid>
    </DraggableModal>
  );
}
