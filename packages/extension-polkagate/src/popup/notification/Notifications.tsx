// Copyright 2019-2024 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable react/jsx-max-props-per-line */

import type { NotificationsType } from '../../hooks/useNotifications';

import { Notifications as NotificationsIcon, NotificationsActive as NotificationsActiveIcon, NotificationsNone as NotificationsNoneIcon } from '@mui/icons-material';
import { Badge, Divider, Grid, IconButton, Popover, type SxProps, type Theme, Typography, useTheme } from '@mui/material';
import React, { useCallback, useContext, useMemo } from 'react';

import { ActionContext, PButton } from '../../components';
import { useAnimateOnce, useNotifications, useTranslation } from '../../hooks';
import { EXTENSION_NAME } from '../../util/constants';
import NotificationItem from './NotificationItem';

const shakeEffect = {
  '@keyframes wiggle': {
    '0%': { transform: 'rotate(-8deg)' },
    '100%': { transform: 'rotate(0deg)' },
    '25%': { transform: 'rotate(8deg)' },
    '50%': { transform: 'rotate(-8deg)' },
    '75%': { transform: 'rotate(8deg)' }
  },
  animation: 'wiggle 0.1s ease-in-out infinite'
} as SxProps<Theme>;

interface NotificationBoxProps {
  notifications: NotificationsType;
  markAsRead: () => void;
  noNewNotifications: boolean;
}

interface NotificationListProps {
  notifications: NotificationsType;
}

const FirstNotification = () => {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);

  const goToNotificationSettings = useCallback(() => {
    onAction('/manage-notification');
  }, [onAction]);

  return (
    <Grid container item sx={{ p: '8px' }}>
      <Grid alignItems='center' container item>
        <Typography fontSize='14px' fontWeight={500} py='3px' textAlign='left'>
          {`${t('Introducing notifications')}!`}
        </Typography>
      </Grid>
      <Typography fontSize='14px' fontWeight={400} pt='5px' textAlign='left' width='100%'>
        {t('{{extensionName}} now has notifications! Important warnings and updates will be delivered to you as notifications, so make sure you don\'t miss any.',
          { replace: { extensionName: EXTENSION_NAME } })}
      </Typography>
      <Typography fontSize='14px' fontWeight={500} pb='10px' pt='15px' textAlign='left'>
        {t('Fine-tune your notification experience in Settings')}:
      </Typography>
      <PButton
        _fontSize='13px'
        _ml={0}
        _mt='10px'
        _onClick={goToNotificationSettings}
        _width='100'
        text={t('Setting')}
      />
    </Grid>
  );
};

const NotificationList = React.memo(function NotificationList ({ notifications }: NotificationListProps) {
  return (
    <Grid container item sx={{ mt: '10px' }}>
      {notifications.notificationMessages?.length === 0 && <FirstNotification />}
      {notifications.notificationMessages && notifications.notificationMessages.length > 0 &&
        notifications.notificationMessages.map((message, index) => {
          const isLastOne = (notifications.notificationMessages?.length ?? 1) === index + 1;

          return (
            <>
              <NotificationItem
                key={index}
                message={message}
              />
              {!isLastOne && <Divider sx={{ bgcolor: 'secondary.main', height: '1px', my: '5px', width: '100%' }} />}
            </>
          );
        })}
    </Grid>
  );
});

const NotificationBox = React.memo(function NotificationBox ({ markAsRead, noNewNotifications, notifications }: NotificationBoxProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  const unReadCount = useMemo(() => notifications.notificationMessages?.filter(({ read }) => !read).length, [notifications.notificationMessages]);

  return (
    <Grid container item sx={{ p: '15px', width: '320px' }}>
      <Grid alignItems='center' container item justifyContent='space-between' sx={{ '> button': { p: '8px' } }}>
        <Grid alignItems='center' container item width='fit-content'>
          <Badge anchorOrigin={{ horizontal: 'left', vertical: 'top' }} badgeContent={unReadCount} color='primary' max={9}>
            <NotificationsNoneIcon sx={{ color: theme.palette.secondary.light, fontSize: '24px' }} />
          </Badge>
          <Typography fontSize='14px' fontWeight={400} width='fit-content'>
            {t('Notifications')}
          </Typography>
        </Grid>
        <PButton
          _fontSize='13px'
          _ml={0}
          _mt='0px'
          _onClick={markAsRead}
          _width='fit-content'
          disabled={noNewNotifications}
          text={t('Mark as read')}
        />
      </Grid>
      <NotificationList notifications={notifications} />
    </Grid>
  );
});

export default function Notifications (): React.ReactElement {
  const theme = useTheme();
  const { markAsRead, notifications } = useNotifications();

  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);

  const noNewNotifications = useMemo(() => !!notifications.notificationMessages?.every(({ read }) => read === true), [notifications]);

  const trigger = useAnimateOnce(!noNewNotifications, { duration: 3000 });

  const onClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  return (
    <>
      <IconButton onClick={onClick} sx={{ p: '5px' }}>
        {noNewNotifications
          ? <NotificationsIcon sx={{ color: theme.palette.secondary.light, fontSize: '23px' }} />
          : <NotificationsActiveIcon sx={{ color: theme.palette.secondary.light, fontSize: '23px', ...(trigger ? shakeEffect : {}) }} />
        }
      </IconButton>
      <Popover
        BackdropProps={{
          style: {
            backdropFilter: 'blur(5px)',
            backgroundColor: 'transparent'
          }
        }}
        anchorEl={anchorEl}
        anchorOrigin={{
          horizontal: 'right',
          vertical: 'bottom'
        }}
        onClose={handleClose}
        open={Boolean(anchorEl)}
        sx={{ mt: '5px' }}
        transformOrigin={{
          horizontal: 'right',
          vertical: 'top'
        }}
      >
        <NotificationBox markAsRead={markAsRead} noNewNotifications={noNewNotifications} notifications={notifications} />
      </Popover>
    </>
  );
}
