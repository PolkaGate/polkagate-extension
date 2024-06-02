// Copyright 2019-2024 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable react/jsx-max-props-per-line */

import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import BackspaceIcon from '@mui/icons-material/Backspace';
import { Divider, Grid, SxProps, Theme, Typography, useTheme } from '@mui/material';
import React, { useCallback } from 'react';

import { ApiPromise } from '@polkadot/api';
import { Chain } from '@polkadot/extension-chains/types';

import { Checkbox2, Identity, Label2, Progress } from '../../../components';
import { useTranslation } from '../../../components/translate';
import { ProxyItem } from '../../../util/types';

interface Props {
  api: ApiPromise | undefined;
  chain: Chain | null | undefined;
  style?: SxProps<Theme>;
  proxyItems: ProxyItem[] | null | undefined;
  handleDelete?: (proxyItem: ProxyItem) => void;
  status?: 'Editable' | 'Read-Only';
  tableLabel?: string;
  labelAlignment?: 'left' | 'center' | 'right';
}

export default function ProxyTableFL ({ api, chain, handleDelete, labelAlignment, proxyItems, status = 'Editable', style, tableLabel }: Props): React.ReactElement {
  const { t } = useTranslation();
  const theme = useTheme();

  const _handleDelete = useCallback((proxyItem: ProxyItem) => handleDelete && handleDelete(proxyItem), [handleDelete]);

  const Delete = ({ proxyItem }: { proxyItem: ProxyItem }) => (
    // eslint-disable-next-line react/jsx-no-bind
    <Grid height={25} onClick={() => _handleDelete(proxyItem)}>
      {proxyItem.status === 'new'
        ? <BackspaceIcon
          sx={{
            color: 'secondary.main',
            cursor: 'pointer',
            height: '25px',
            width: '30px'
          }}
        />
        : <Checkbox2
          checked={proxyItem.status === 'remove'}
          style={{ transform: 'scale(1.4)' }}
        />
      }
    </Grid>
  );

  const proxyStatus = useCallback((_status: string): string => {
    if (_status === 'new') {
      return t('Adding');
    } else if (_status === 'remove') {
      return t('Removing');
    } else {
      return t('No change');
    }
  }, [t]);

  return (
    <Grid container item sx={style}>
      <Label2 label={tableLabel ?? t('Proxies')} labelAlignment={labelAlignment}>
        <Grid className='contextBox' container display='block' item sx={{ bgcolor: 'background.paper', border: theme.palette.mode === 'dark' ? 1 : 0, borderColor: 'secondary.light', boxShadow: '2px 3px 4px 0px rgba(0, 0, 0, 0.1)', maxHeight: '270px', overflow: 'scroll' }}>
          <Grid alignItems='center' container item justifyContent='flex-end' sx={{ borderBottom: '1px solid', borderBottomColor: 'secondary.light', height: '32px', textAlign: 'center' }}>
            <Typography fontSize='14px' fontWeight={400} width='49%'>
              {t('Account')}
            </Typography>
            <Divider orientation='vertical' sx={{ bgcolor: 'secondary.light', height: '32px', width: '1px' }} />
            <Typography fontSize='14px' fontWeight={400} width='25%'>
              {t('Type')}
            </Typography>
            <Divider orientation='vertical' sx={{ bgcolor: 'secondary.light', height: '32px', width: '1px' }} />
            <Typography fontSize='14px' fontWeight={400} width='10%'>
              {t('Delay')}
            </Typography>
            <Divider orientation='vertical' sx={{ bgcolor: 'secondary.light', height: '32px', width: '1px' }} />
            <Typography fontSize='14px' fontWeight={400} width='15%'>
              {status === 'Editable'
                ? t('Delete')
                : t('Status')
              }
            </Typography>
          </Grid>
          <Grid container direction='column' display='flex' item sx={{ '>:last-child': { border: 'none' } }}>
            {proxyItems?.map((proxyItem, index) => {
              return (
                <Grid alignItems='center' container item justifyContent='flex-end' key={index} sx={{ borderBottom: '1px solid', borderBottomColor: 'secondary.light', height: '50px', textAlign: 'center' }}>
                  <Grid container fontSize='20px' item pl='10px' width='49%'>
                    <Identity
                      api={api}
                      chain={chain}
                      formatted={proxyItem.proxy.delegate}
                      identiconSize={35}
                      showShortAddress
                      style={{ fontSize: '16px' }}
                    />
                  </Grid>
                  <Divider orientation='vertical' sx={{ bgcolor: 'secondary.light', height: '50px', width: '1px' }} />
                  <Grid container item justifyContent='center' width='25%'>
                    <Typography fontSize='16px' fontWeight={500}>
                      {proxyItem.proxy.proxyType}
                    </Typography>
                  </Grid>
                  <Divider orientation='vertical' sx={{ bgcolor: 'secondary.light', height: '50px', width: '1px' }} />
                  <Grid container item justifyContent='center' width='10%'>
                    <Typography fontSize='16px' fontWeight={500}>
                      {proxyItem.proxy.delay}
                    </Typography>
                  </Grid>
                  <Divider orientation='vertical' sx={{ bgcolor: 'secondary.light', height: '50px', width: '1px' }} />
                  <Grid container item justifyContent='center' width='15%'>
                    {status === 'Editable'
                      ? <Delete
                        proxyItem={proxyItem}
                      />
                      : <Typography fontSize='16px' fontWeight={500}>
                        {proxyStatus(proxyItem.status)}
                      </Typography>
                    }
                  </Grid>
                </Grid>);
            })}
            {proxyItems === undefined &&
              <Progress pt='20px' size={50} title={t('looking for proxies...')} />
            }
            {(proxyItems === null || proxyItems?.length === 0) &&
              <Grid display='inline-flex' m='auto' py='30px'>
                <FontAwesomeIcon fontSize={22} icon={faExclamationTriangle} />
                <Typography fontSize='14px' fontWeight={400} lineHeight='20px' pl='8px'>
                  {t('No proxies found.')}
                </Typography>
              </Grid>
            }
          </Grid>
        </Grid>
      </Label2>
    </Grid>
  );
}
