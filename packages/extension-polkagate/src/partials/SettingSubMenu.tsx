// Copyright 2019-2024 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable react/jsx-max-props-per-line */

import { faListCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Collapse, Divider, Grid, useTheme } from '@mui/material';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';

import settings from '@polkadot/ui-settings';

import { ActionContext, Checkbox2, MenuItem, Select, SelectIdenticonTheme, VaadinIcon } from '../components';
import { getStorage } from '../components/Loading';
import { useTranslation } from '../hooks';
import { setNotification } from '../messaging';
import getLanguageOptions from '../util/getLanguageOptions';

interface Props {
  isTestnetEnabledChecked: boolean | undefined;
  setTestnetEnabledChecked: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  show: boolean;
  onChange: () => void;
}

export default function SettingSubMenu ({ isTestnetEnabledChecked, onChange, setTestnetEnabledChecked, show }: Props): React.ReactElement {
  const { t } = useTranslation();
  const theme = useTheme();
  const onAction = useContext(ActionContext);

  const [notification, updateNotification] = useState(settings.notification);
  const [camera, setCamera] = useState(settings.camera === 'on');
  const [isSentryEnabled, setIsSentryEnabled] = useState(
    localStorage.getItem('sentryEnabled') === 'true'
  );

  const languageOptions = useMemo(() => getLanguageOptions(), []);
  const notificationOptions = useMemo(() => ['Extension', 'PopUp', 'Window'].map((item) => ({ text: item, value: item.toLowerCase() })), []);

  useEffect(() => {
    settings.set({ camera: camera ? 'on' : 'off' });
  }, [camera]);

  const onAuthManagement = useCallback(() => {
    onAction('/auth-list');
  }, [onAction]);

  const onChangeLang = useCallback((value: string | number): void => {
    settings.set({ i18nLang: value as string });
  }, []);

  const onManageLoginPassword = useCallback(() => {
    onAction('/login-password');
  }, [onAction]);

  const onChangeNotification = useCallback((value: string | number): void => {
    const _value = value as string;

    setNotification(_value).catch(console.error);

    updateNotification(_value);
    settings.set({ notification: _value });
  }, []);

  const toggleCamera = useCallback(() => {
    setCamera(!camera);
  }, [camera]);

  const toggleErrorReporting = useCallback(() => {
    const newValue = !isSentryEnabled;

    setIsSentryEnabled(newValue);
    localStorage.setItem('sentryEnabled', newValue ? 'true' : 'false');
  }, [isSentryEnabled]);

  useEffect(() => {
    getStorage('testnet_enabled').then((res) => {
      setTestnetEnabledChecked(!!res);
    }).catch(console.error);
  }, [setTestnetEnabledChecked]);

  return (
    <Collapse easing={{ enter: '200ms', exit: '100ms' }} in={show} sx={{ width: '100%' }}>
      <Grid container item justifyContent='flex-end'>
        <Divider sx={{ bgcolor: 'divider', height: '1px', mx: '10px', width: '83%' }} />
        <Grid container direction='column' height='320px' pl='40px' pr='5px' pt='10px'>
          <Grid item pt='5px' textAlign='left'>
            <Checkbox2
              checked={isTestnetEnabledChecked}
              iconStyle={{ transform: 'scale(1.13)' }}
              label={t('Enable testnet chains')}
              labelStyle={{ fontSize: '17px', fontWeight: 300, marginLeft: '7px' }}
              onChange={onChange}
            />
          </Grid>
          <Grid item pt='10px' textAlign='left'>
            <Checkbox2
              checked={isSentryEnabled}
              iconStyle={{ transform: 'scale(1.13)' }}
              label={t('Enable error reporting')}
              labelStyle={{ fontSize: '17px', fontWeight: 300, marginLeft: '7px' }}
              onChange={toggleErrorReporting}
            />
          </Grid>
          <Grid item pt='10px' textAlign='left'>
            <Checkbox2
              checked={camera}
              iconStyle={{ transform: 'scale(1.13)' }}
              label={t('Allow QR camera access')}
              labelStyle={{ fontSize: '17px', fontWeight: 300, marginLeft: '7px' }}
              onChange={toggleCamera}
            />
          </Grid>
          <Grid container item>
            <MenuItem
              fontSize='17px'
              iconComponent={
                <FontAwesomeIcon
                  color={`${theme.palette.text.primary}`}
                  fontSize='18px'
                  icon={faListCheck}
                />
              }
              onClick={onAuthManagement}
              text={t('Manage website access')}
            />
          </Grid>
          <Grid container item pb={'10px'}>
            <MenuItem
              fontSize='17px'
              iconComponent={
                <VaadinIcon icon='vaadin:key' style={{ color: `${theme.palette.text.primary}`, height: '18px' }} />
              }
              onClick={onManageLoginPassword}
              py='2px'
              text={t('Manage login password')}
            />
          </Grid>
          <SelectIdenticonTheme
            style={{ pt: '3px', width: '100%' }}
          />
          <Grid item pt='10px'>
            <Select
              defaultValue={languageOptions[0].value}
              label={t('Language')}
              onChange={onChangeLang}
              options={languageOptions}
              value={settings.i18nLang !== 'default' ? settings.i18nLang : languageOptions[0].value}
            />
          </Grid>
          <Grid item pt='10px' sx={{ visibility: 'hidden' }}>
            <Select
              defaultValue={notificationOptions[1].value}
              label={t('Notification')}
              onChange={onChangeNotification}
              options={notificationOptions}
              value={notification ?? notificationOptions[1].value}
            />
          </Grid>
        </Grid>
      </Grid>
    </Collapse>
  );
}
