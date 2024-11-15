// Copyright 2019-2024 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable react/jsx-max-props-per-line */

import type { ApiPromise } from '@polkadot/api';
import type { HexString } from '@polkadot/util/types';

import { ArrowForwardIos as ArrowForwardIosIcon } from '@mui/icons-material';
import { Collapse, Divider, Grid, useTheme } from '@mui/material';
import React, { useCallback, useContext, useMemo, useRef, useState } from 'react';

import { AccountContext, Identity } from '../../../components';
import { useChain, useOutsideClick } from '../../../hooks';
import { tieAccount } from '../../../messaging';

interface Props {
  api: ApiPromise | undefined;
  onSelect: (address: string) => void;
  selectedAddress: string | undefined;
  chainGenesis: string | undefined;
  unableToChangeAccount?: boolean;
  inHeading?: boolean;
}

export default function AddressDropdown ({ api, chainGenesis, inHeading, onSelect, selectedAddress, unableToChangeAccount = false }: Props): React.ReactElement<Props> {
  const theme = useTheme();

  const isDarkMode = theme.palette.mode === 'dark';
  const { accounts } = useContext(AccountContext);
  const chain = useChain(selectedAddress);
  const ref = useRef<HTMLDivElement>(null);

  const [isDropdownVisible, setDropdownVisible] = useState(false);

  const addressesToDisplay = useMemo(() => accounts.map(({ address }) => address).filter((address) => address !== selectedAddress), [accounts, selectedAddress]);

  const hideDropdown = useCallback(() => setDropdownVisible(false), []);
  const toggleDropdown = useCallback(() => addressesToDisplay.length > 0 && setDropdownVisible(!isDropdownVisible), [addressesToDisplay, isDropdownVisible]);
  const _onSelect = useCallback((addr: string) => () => {
    addr && chainGenesis && tieAccount(addr, chainGenesis as HexString).then(() => setTimeout(() => onSelect(addr), 150)).catch(console.error);
  }, [chainGenesis, onSelect]);

  useOutsideClick([ref], hideDropdown);

  return (
    <Grid container style={{ position: 'relative' }}>
      <Grid container sx={{ border: inHeading && isDarkMode ? 2 : 1, borderColor: inHeading ? 'divider' : 'secondary.light', borderRadius: '5px', color: 'white' }}>
        <Grid alignItems='center' container item justifyContent='space-around' maxWidth='calc(100% - 40px)' width='fit-content'>
          <Identity
            address={selectedAddress}
            api={api}
            identiconSize={24}
            showSocial={false}
            style={{
              border: 'none',
              fontSize: '14px',
              height: '40px',
              margin: 0,
              maxWidth: '300px',
              minWidth: '150px',
              px: '5px',
              width: 'fit-content'
            }}
          />
        </Grid>
        {!unableToChangeAccount &&
          <Grid alignItems='center' container item onClick={toggleDropdown} ref={ref} sx={{ borderLeft: inHeading && isDarkMode ? 2 : 1, borderLeftColor: inHeading ? 'divider' : 'secondary.light', cursor: 'pointer', px: '10px', width: '40px' }}>
            <ArrowForwardIosIcon sx={{ color: 'secondary.light', fontSize: 18, m: 'auto', stroke: theme.palette.secondary.light, strokeWidth: '2px', transform: isDropdownVisible ? 'rotate(-90deg)' : 'rotate(90deg)', transitionDuration: '0.3s', transitionProperty: 'transform' }} />
          </Grid>
        }
      </Grid>
      <Collapse easing={{ enter: '200ms', exit: '150ms' }} in={isDropdownVisible && !unableToChangeAccount} sx={{ bgcolor: 'background.paper', border: '2px solid', borderColor: 'secondary.light', borderRadius: '5px', boxShadow: '0px 3px 10px rgba(255, 255, 255, 0.25)', maxHeight: '300px', overflow: 'hidden', overflowY: 'scroll', position: 'absolute', top: '45px', width: '100%', zIndex: 10 }}>
        <Grid container py='5px'>
          {addressesToDisplay.map((address, index) => {
            const theLastItem = index === addressesToDisplay.length - 1;

            return (
              <>
                <Grid alignItems='center' container item key={index} onClick={_onSelect(address)} sx={{ cursor: 'pointer', zIndex: 10 }}>
                  <Identity
                    address={address}
                    chain={chain}
                    identiconSize={24}
                    showSocial={false}
                    style={{
                      border: 'none',
                      fontSize: '14px',
                      height: '40px',
                      m: 0,
                      minWidth: '150px',
                      px: '5px',
                      width: 'fit-content',
                      zIndex: 1
                    }}
                  />
                </Grid>
                {!theLastItem && <Divider sx={{ bgcolor: 'secondary.light', height: '1px', my: '5px', width: '100%' }} />}
              </>
            );
          })}
        </Grid>
      </Collapse>
    </Grid>
  );
}
