// Copyright 2019-2024 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable react/jsx-max-props-per-line */

import { Box, Collapse, Divider, Grid, useTheme } from '@mui/material';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';

import settings from '@polkadot/ui-settings';

import { checkBox, checkedBox } from '../../../assets/icons';
import { AccountContext, Select, SelectIdenticonTheme, VaadinIcon } from '../../../components';
import { getStorage, setStorage } from '../../../components/Loading';
import { useIsTestnetEnabled, useTranslation } from '../../../hooks';
import { setNotification, tieAccount } from '../../../messaging';
import ManageWebAccess from '../../../popup/authManagement';
import { TEST_NETS } from '../../../util/constants';
import getLanguageOptions from '../../../util/getLanguageOptions';
import EnableTestNetsModal from './EnableTestNetsModal';
import { TaskButton } from './HomeMenu';
import ManageLoginPassword from './ManageLoginPassword';

interface Props {
  show: boolean;
}

export default function SettingSubMenuFullScreen ({ show }: Props): React.ReactElement {
  const { t } = useTranslation();
  const theme = useTheme();
  const { accounts } = useContext(AccountContext);
  const isTestnetEnabled = useIsTestnetEnabled();

  const [isEnableTestnetChecked, setIsTestnetEnabledChecked] = useState<boolean>();
  const [testnetWarning, setShowTestnetWarning] = useState<boolean>(false);
  const [showManageWebAccess, setShowManageWebAccess] = useState<boolean>(false);
  const [showManageLoginPassword, setShowManageLoginPassword] = useState<boolean>(false);
  const [isSentryEnabled, setIsSentryEnabled] = useState(
    localStorage.getItem('sentryEnabled') === 'true'
  );
  const onEnableTestNetClick = useCallback(() => {
    !isEnableTestnetChecked && setShowTestnetWarning(true);

    if (isEnableTestnetChecked) {
      setStorage('testnet_enabled', false).catch(console.error);
      accounts?.forEach(({ address, genesisHash }) => {
        if (genesisHash && TEST_NETS.includes(genesisHash)) {
          tieAccount(address, null).catch(console.error);
        }
      });
      setIsTestnetEnabledChecked(false);
    }
  }, [accounts, isEnableTestnetChecked]);

  const [notification, updateNotification] = useState(settings.notification);
  const [camera, setCamera] = useState(settings.camera === 'on');

  const languageOptions = useMemo(() => getLanguageOptions(), []);
  const notificationOptions = ['Extension', 'PopUp', 'Window'].map((item) => ({ text: item, value: item.toLowerCase() }));

  useEffect(() => {
    settings.set({ camera: camera ? 'on' : 'off' });
  }, [camera]);

  const onAuthManagement = useCallback(() => {
    setShowManageWebAccess(true);
  }, []);

  const onChangeLang = useCallback((value: string): void => {
    settings.set({ i18nLang: value });
  }, []);

  const onManageLoginPassword = useCallback(() => {
    setShowManageLoginPassword(true);
  }, []);

  const onChangeNotification = useCallback((value: string): void => {
    setNotification(value).catch(console.error);

    updateNotification(value);
    settings.set({ notification: value });
  }, []);

  const toggleCamera = useCallback(() => {
    setCamera(!camera);
  }, [camera]);

  useEffect(() => {
    getStorage('testnet_enabled').then((res) => {
      setIsTestnetEnabledChecked(res as unknown as boolean);
    }).catch(console.error);
  }, [setIsTestnetEnabledChecked]);

  const toggleErrorReporting = useCallback(() => {
    const newValue = !isSentryEnabled;

    setIsSentryEnabled(newValue);
    localStorage.setItem('sentryEnabled', newValue ? 'true' : 'false');
  }, [isSentryEnabled]);

  return (
    <>
      <Collapse in={show}>
        <>
          <Divider sx={{ bgcolor: 'divider', height: '1px', justifySelf: 'flex-end', width: '81%' }} />
          <Grid container direction='column' sx={{ p: '0px 0 15px 40px' }}>
            <TaskButton
              icon={
                <Box
                  component='img'
                  src={isTestnetEnabled ? checkedBox as string : checkBox as string}
                  sx={{ height: 20, width: 20 }}
                />
              }
              isSubMenu
              onClick={onEnableTestNetClick}
              text={t('Enable testnet chains')}
            />
            <TaskButton
              icon={
                <Box
                  component='img'
                  src={isSentryEnabled ? checkedBox as string : checkBox as string}
                  sx={{ height: 20, width: 20 }}
                />
              }
              isSubMenu
              onClick={toggleErrorReporting}
              text={t('Enable error reporting')}
            />
            <TaskButton
              icon={
                <Box
                  component='img'
                  src={camera ? checkedBox as string : checkBox as string}
                  sx={{ height: 20, width: 20 }}
                />
              }
              isSubMenu
              onClick={toggleCamera}
              text={t('Allow QR camera access')}
            />
            <TaskButton
              icon={
                <VaadinIcon icon='vaadin:lines-list' style={{ color: `${theme.palette.text.primary}`, height: '25px', width: '25px' }} />
              }
              isSubMenu
              onClick={onAuthManagement}
              text={t('Manage website access')}
            />
            <TaskButton
              icon={
                <VaadinIcon icon='vaadin:key' style={{ color: `${theme.palette.text.primary}`, height: '25px', width: '25px' }} />
              }
              isSubMenu
              onClick={onManageLoginPassword}
              text={t('Manage login password')}
            />
            <SelectIdenticonTheme
              style={{ pt: '18px', width: '100%' }}
            />
            <Grid item pt='10px'>
              <Select
                label={t('Language')}
                //@ts-ignore
                onChange={onChangeLang}
                options={languageOptions}
                value={settings.i18nLang !== 'default' ? settings.i18nLang : languageOptions[0].value}
              />
            </Grid>
            <Grid item pt='10px'>
              <Select
                label={t('Notification')}
                //@ts-ignore
                onChange={onChangeNotification}
                options={notificationOptions}
                value={notification ?? notificationOptions[1].value}
              />
            </Grid>
          </Grid>
        </>
      </Collapse>
      <EnableTestNetsModal
        open={testnetWarning}
        setDisplayPopup={setShowTestnetWarning}
        setIsTestnetEnabled={setIsTestnetEnabledChecked}
      />
      <ManageWebAccess
        open={showManageWebAccess}
        setDisplayPopup={setShowManageWebAccess}
      />
      <ManageLoginPassword
        open={showManageLoginPassword}
        setDisplayPopup={setShowManageLoginPassword}
      />
    </>
  );
}
