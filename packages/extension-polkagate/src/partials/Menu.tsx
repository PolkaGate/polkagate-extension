// Copyright 2019-2024 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable react/jsx-max-props-per-line */

import type { TransitionProps } from '@mui/material/transitions';

import { Close as CloseIcon, Lock as LockIcon } from '@mui/icons-material';
import { Dialog, Divider, Grid, IconButton, Slide, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { useCallback, useContext, useState } from 'react';

import { AccountContext, ActionContext, FullScreenIcon, Infotip2, MenuItem, TwoButtons, VaadinIcon, Warning } from '../components';
import { setStorage, updateStorage } from '../components/Loading';
import { useExtensionLockContext } from '../context/ExtensionLockContext';
import ThemeChanger from '../fullscreen/governance/partials/ThemeChanger';
import { useIsLoginEnabled, useTranslation } from '../hooks';
import { lockExtension, tieAccount } from '../messaging';
import { NO_PASS_PERIOD, TEST_NETS } from '../util/constants';
import ImportAccSubMenu from './ImportAccSubMenu';
import NewAccountSubMenu from './NewAccountSubMenu';
import SettingSubMenu from './SettingSubMenu';
import VersionSocial from './VersionSocial';

interface Props {
  setShowMenu: React.Dispatch<React.SetStateAction<boolean>>;
  isMenuOpen: boolean;
}

enum COLLAPSIBLE_MENUS {
  NONE,
  NEW_ACCOUNT,
  IMPORT_ACCOUNT,
  SETTING
}

export enum POPUP_MENUS {
  NONE,
  TEST_NET
}

const Transition = React.forwardRef(function Transition (props: TransitionProps & { children: React.ReactElement<unknown>; }, ref: React.Ref<unknown>) {
  return <Slide direction='left' ref={ref} {...props} />;
});

const Div = () => <Divider sx={{ bgcolor: 'divider', height: '1px', justifySelf: 'flex-end', mx: '10px', width: '83%' }} />;

function Menu ({ isMenuOpen, setShowMenu }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const theme = useTheme();
  const onAction = useContext(ActionContext);
  const isLoginEnabled = useIsLoginEnabled();
  const { setExtensionLock } = useExtensionLockContext();

  const [collapsedMenu, setCollapsedMenu] = useState(COLLAPSIBLE_MENUS.SETTING);
  const [isTestnetEnableConfirmed, setIsTestnetEnableConfirmed] = useState<boolean>();
  const [showPopup, setShowPopup] = useState(POPUP_MENUS.NONE);
  const { accounts } = useContext(AccountContext);

  const onLockExtension = useCallback((): void => {
    updateStorage('loginInfo', { lastLoginTime: Date.now() - NO_PASS_PERIOD }).then(() => {
      setExtensionLock(true);
      lockExtension().catch(console.error);
    }).catch(console.error);
  }, [setExtensionLock]);

  const toggleImportSubMenu = useCallback(() => {
    collapsedMenu === COLLAPSIBLE_MENUS.IMPORT_ACCOUNT
      ? setCollapsedMenu(COLLAPSIBLE_MENUS.NONE)
      : setCollapsedMenu(COLLAPSIBLE_MENUS.IMPORT_ACCOUNT);
  }, [collapsedMenu]);

  const toggleNewAccountSubMenu = useCallback(() => {
    collapsedMenu === COLLAPSIBLE_MENUS.NEW_ACCOUNT
      ? setCollapsedMenu(COLLAPSIBLE_MENUS.NONE)
      : setCollapsedMenu(COLLAPSIBLE_MENUS.NEW_ACCOUNT);
  }, [collapsedMenu]);

  const toggleSettingSubMenu = useCallback(() => {
    collapsedMenu === COLLAPSIBLE_MENUS.SETTING
      ? setCollapsedMenu(COLLAPSIBLE_MENUS.NONE)
      : setCollapsedMenu(COLLAPSIBLE_MENUS.SETTING);
  }, [collapsedMenu]);

  const onCloseMenu = useCallback(() => {
    setShowMenu(false);
  }, [setShowMenu]);

  const _goToExportAll = useCallback(() => {
    onAction('/account/export-all');
  }, [onAction]);

  const onEnableTestnetConfirm = useCallback(() => {
    setShowPopup(POPUP_MENUS.NONE);
    setIsTestnetEnableConfirmed(true);
    setStorage('testnet_enabled', true).catch(console.error);
  }, []);

  const onEnableTestnetReject = useCallback(() => {
    setShowPopup(POPUP_MENUS.NONE);
    setIsTestnetEnableConfirmed(false);
  }, []);

  const onEnableTestNetClick = useCallback(() => {
    !isTestnetEnableConfirmed && setShowPopup(POPUP_MENUS.TEST_NET);

    if (isTestnetEnableConfirmed) {
      setStorage('testnet_enabled', false).catch(console.error);
      accounts?.forEach(({ address, genesisHash }) => {
        if (genesisHash && TEST_NETS.includes(genesisHash)) {
          tieAccount(address, null).catch(console.error);
        }
      });
      setIsTestnetEnableConfirmed(false);
    }
  }, [accounts, isTestnetEnableConfirmed]);

  return (
    <Dialog
      PaperProps={{
        sx: {
          backgroundImage: 'unset',
          bgcolor: 'transparent',
          boxShadow: 'unset'
        }
      }}
      TransitionComponent={Transition}
      componentsProps={{
        backdrop: {
          sx: {
            backdropFilter: 'blur(5px)',
            bgcolor: 'transparent'
          }
        }
      }}
      fullScreen
      open={isMenuOpen}
    >
      <Grid container height='100%' item justifyContent='end' zIndex={10}>
        <Grid alignItems='flex-start' bgcolor='background.default' container display='block' item p='5px 10px' sx={{ boxShadow: '0px 0px 10px rgba(255, 255, 255, 0.25)', height: '100%', minWidth: '307px', position: 'relative' }} width='86%'>
          {showPopup === POPUP_MENUS.NONE
            ? <>
              <Grid container item justifyContent='space-between'>
                <IconButton onClick={onCloseMenu} sx={{ m: '8px', ml: 0, p: '0px' }}>
                  <CloseIcon sx={{ color: 'secondary.light', fontSize: 35 }} />
                </IconButton>
                <Grid alignItems='center' columnGap='10px' container item pr='15px' width='fit-content'>
                  {isLoginEnabled &&
                    <Grid container item width='fit-content'>
                      <Infotip2
                        text={t('Lock Extension')}
                      >
                        <IconButton
                          onClick={onLockExtension}
                          sx={{ height: '35px', ml: '-5px', p: 0, width: '35px' }}
                        >
                          <LockIcon sx={{ color: 'secondary.light', cursor: 'pointer', fontSize: '27px' }} />
                        </IconButton>
                      </Infotip2>
                    </Grid>
                  }
                  <>
                    <Grid item>
                      <Infotip2
                        text={t('Switch Theme')}
                      >
                        <IconButton
                          sx={{ height: '35px', p: 0, width: '35px' }}
                        >
                          <ThemeChanger color='secondary.light' noBorder />
                        </IconButton>
                      </Infotip2>
                    </Grid>
                  </>
                  <FullScreenIcon isSettingSubMenu url='/' />
                </Grid>
              </Grid>
              <Div />
              <MenuItem
                iconComponent={
                  <VaadinIcon icon='vaadin:plus-circle' spin={collapsedMenu === COLLAPSIBLE_MENUS.NEW_ACCOUNT} style={{ color: `${theme.palette.text.primary}`, height: '18px' }} />
                }
                onClick={toggleNewAccountSubMenu}
                showSubMenu={collapsedMenu === COLLAPSIBLE_MENUS.NEW_ACCOUNT}
                text={t('New account')}
                withHoverEffect
              >
                <NewAccountSubMenu show={collapsedMenu === COLLAPSIBLE_MENUS.NEW_ACCOUNT} />
              </MenuItem>
              <Div />
              <MenuItem
                iconComponent={
                  <VaadinIcon float={collapsedMenu === COLLAPSIBLE_MENUS.IMPORT_ACCOUNT} icon='vaadin:upload-alt' style={{ color: `${theme.palette.text.primary}`, height: '18px' }} />
                }
                onClick={toggleImportSubMenu}
                showSubMenu={collapsedMenu === COLLAPSIBLE_MENUS.IMPORT_ACCOUNT}
                text={t('Import account')}
                withHoverEffect
              >
                <ImportAccSubMenu show={collapsedMenu === COLLAPSIBLE_MENUS.IMPORT_ACCOUNT} toggleSettingSubMenu={toggleSettingSubMenu} />
              </MenuItem>
              <Div />
              <MenuItem
                iconComponent={
                  <VaadinIcon icon='vaadin:download' style={{ color: `${theme.palette.text.primary}`, height: '18px' }} />
                }
                onClick={_goToExportAll}
                text={t('Export all accounts')}
                withHoverEffect
              />
              <Div />
              <MenuItem
                iconComponent={
                  <VaadinIcon icon='vaadin:cog' spin={collapsedMenu === COLLAPSIBLE_MENUS.SETTING} style={{ color: `${theme.palette.text.primary}`, height: '18px' }} />
                }
                onClick={toggleSettingSubMenu}
                showSubMenu={collapsedMenu === COLLAPSIBLE_MENUS.SETTING}
                text={t('Settings')}
                withHoverEffect
              >
                <SettingSubMenu
                  isTestnetEnabledChecked={isTestnetEnableConfirmed}
                  onChange={onEnableTestNetClick}
                  setTestnetEnabledChecked={setIsTestnetEnableConfirmed}
                  show={collapsedMenu === COLLAPSIBLE_MENUS.SETTING}
                />
              </MenuItem>
            </>
            : showPopup === POPUP_MENUS.TEST_NET &&
              <Grid container justifyContent='space-between' sx={{ pt: '30px' }}>
                <Grid item sx={{ pb: '35px', textAlign: 'center' }} xs={12}>
                  <Typography fontSize='20px'>
                    {t('Warning')}
                  </Typography>
                </Grid>
                <Grid container sx={{ '> div': { pl: 0 }, textAlign: 'justify' }}>
                  <Warning
                    iconDanger
                    isBelowInput
                    marginTop={0}
                    theme={theme}
                  >
                    {t('Enabling testnet chains may cause instability or crashes since they\'re meant for testing. Proceed with caution. If issues arise, return here to disable the option.')}
                  </Warning>
                </Grid>
                <Grid container>
                  <TwoButtons
                    mt='55px'
                    onPrimaryClick={onEnableTestnetConfirm}
                    onSecondaryClick={onEnableTestnetReject}
                    primaryBtnText={t<string>('Confirm')}
                    secondaryBtnText={t<string>('Reject')}
                  />
                </Grid>
              </Grid>
          }
          <VersionSocial fontSize='11px' />
        </Grid>
      </Grid>
    </Dialog>
  );
}

export default React.memo(Menu);
