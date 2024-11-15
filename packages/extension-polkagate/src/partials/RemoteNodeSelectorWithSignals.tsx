// Copyright 2019-2024 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable react/jsx-max-props-per-line */

import { SignalCellular0BarOutlined as LightClientEndpointIcon, SignalCellularAlt as Signal3BarIcon, SignalCellularAlt1Bar as Signal1BarIcon, SignalCellularAlt2Bar as Signal2BarIcon } from '@mui/icons-material';
import { Divider, Grid, Popover, Skeleton, Typography, useTheme } from '@mui/material';
// @ts-ignore
import { Circle } from 'better-react-spinkit';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { noop } from '@polkadot/util';

import EndpointManager from '../class/endpointManager';
import { Switch } from '../components';
import { useEndpoint, useEndpoints, useGenesisHash, useInfo } from '../hooks';
import useIsExtensionPopup from '../hooks/useIsExtensionPopup';
import CalculateNodeDelay from '../util/calculateNodeDelay';
import { AUTO_MODE } from '../util/constants';

interface Props {
  address: string | undefined;
  iconSize?: number;
}

type EndpointsDelay = { name: string, delay: number | null | undefined, value: string }[];

interface NodesListProps {
  address?: string,
  defaultColor: string;
  endpointsDelay: EndpointsDelay | undefined,
  setCurrentDelay: React.Dispatch<React.SetStateAction<number | undefined>>;
  setEndpointsDelay: React.Dispatch<React.SetStateAction<EndpointsDelay | undefined>>;
}

interface ListIndicatorProps {
  currentDelay: number | undefined;
  defaultColor: string;
  endpointUrl: string | undefined;
  iconSize: number;
  isDark: boolean;
  id: 'simple-popover' | undefined;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  setCurrentDelay: React.Dispatch<React.SetStateAction<number | undefined>>;
}

const SIGNAL_COLORS = {
  green: '#1F7720',
  orange: '#FF5722',
  red: '#C70000'
};

const endpointManager = new EndpointManager();

const NodeStatusIcon = ({ defaultColor, iconSize = 35, ms, position }: { defaultColor: string, ms: number | null | undefined, iconSize?: number, position?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky' | 'unset' }) => {
  const iconStyle = {
    bottom: '2px',
    fontSize: `${iconSize}px`,
    left: '2px',
    position: 'absolute'
  };

  const getSignalIcon = () => {
    if (ms === null || ms === undefined) {
      return null;
    }

    if (ms <= 100) {
      return <Signal3BarIcon sx={{ ...iconStyle, color: SIGNAL_COLORS.green }} />;
    } else if (ms <= 300) {
      return <Signal2BarIcon sx={{ ...iconStyle, color: SIGNAL_COLORS.orange }} />;
    }

    return <Signal1BarIcon sx={{ ...iconStyle, color: SIGNAL_COLORS.red }} />;
  };

  return (
    <Grid container height='35px' item position={position || 'relative'} width='40px'>
      <Signal3BarIcon sx={{ ...iconStyle, color: defaultColor }} />
      {getSignalIcon()}
    </Grid>
  );
};

const NodeStatusAndDelay = ({ defaultColor, endpointDelay, isSelected = false }: { defaultColor: string, endpointDelay: number | null | undefined, isSelected?: boolean }) => {
  const statusColor = useCallback((ms: number) => {
    switch (true) {
      case ms <= 100:
        return SIGNAL_COLORS.green;
      case ms <= 300:
        return SIGNAL_COLORS.orange;
      default:
        return SIGNAL_COLORS.red;
    }
  }, []);

  return (
    <Grid alignItems='center' container item sx={{ width: 'fit-content' }}>
      {<Typography color={endpointDelay ? statusColor(endpointDelay) : 'inherit'} fontSize='16px' fontWeight={isSelected ? 500 : 400} pr='10px'>
        {endpointDelay
          ? `${endpointDelay} ms`
          : (endpointDelay === undefined || isSelected)
            ? <Skeleton
              animation='wave'
              height='20px'
              variant='rounded'
              width='55px'
            />
            : ''}
      </Typography>}
      <NodeStatusIcon
        defaultColor={defaultColor}
        ms={endpointDelay}
      />
    </Grid>
  );
};

const NodesList = ({ address, defaultColor, endpointsDelay, setCurrentDelay, setEndpointsDelay }: NodesListProps) => {
  const theme = useTheme();

  const { genesisHash } = useInfo(address);
  const endpointOptions = useEndpoints(genesisHash);
  const { endpoint: endpointUrl, isAuto: isAlreadyAuto } = useEndpoint(address);
  const [isAutoSwitchOn, setAutoSwitch] = useState<boolean>();

  useEffect(() => {
    if (isAlreadyAuto === undefined) {
      return;
    }

    setAutoSwitch(isAlreadyAuto);
  }, [isAlreadyAuto]);

  const sanitizedCurrentEndpointName = useMemo(() => {
    const currentEndpointName = endpointOptions.find((endpoint) => endpoint.value === endpointUrl)?.text;

    return currentEndpointName?.replace(/^via\s/, '');
  }, [endpointOptions, endpointUrl]);

  const onChangeEndpoint = useCallback((newEndpoint: string): void => {
    if (!address || !genesisHash) {
      return;
    }

    const isNewEndpointAuto = newEndpoint === AUTO_MODE.value;

    setEndpointsDelay((prevEndpoints) => {
      return prevEndpoints?.map((endpoint) => {
        // set the new endpoint delay to undefined
        if (endpoint.value === newEndpoint && !endpoint.delay) {
          return { ...endpoint, delay: undefined };
        }

        return endpoint;
      });
    });

    const addressKey = String(address);
    const shouldDisableAutoMode = isNewEndpointAuto && isAlreadyAuto; // auto mode was On and user have clicked on it again, which will change the switch Off

    if (shouldDisableAutoMode) {
      setAutoSwitch(false);

      endpointManager.set(addressKey, genesisHash, {
        checkForNewOne: false,
        endpoint: endpointUrl,
        isAuto: false,
        timestamp: Date.now()
      });

      return;
    }

    setCurrentDelay(undefined);

    if (isNewEndpointAuto) {
      setAutoSwitch(true);
    } else {
      setAutoSwitch(false);
    }

    endpointManager.set(addressKey, genesisHash, {
      checkForNewOne: isNewEndpointAuto,
      endpoint: newEndpoint,
      isAuto: isNewEndpointAuto,
      timestamp: Date.now()
    });
  }, [address, endpointUrl, genesisHash, isAlreadyAuto, setCurrentDelay, setEndpointsDelay]);

  return (
    <Grid container direction='column' item sx={{ display: 'block', minWidth: '275px', py: '6px', width: 'fit-content' }}>
      {endpointsDelay && endpointsDelay.length > 0 &&
        endpointsDelay.map(({ delay, name, value }, index) => {
          const isLightClient = name.includes('light client');

          const isSelected = name === sanitizedCurrentEndpointName;
          const hasAutoName = name === AUTO_MODE.text;
          const isAutoSelected = hasAutoName && isAlreadyAuto;

          return (
            <>
              <Grid alignItems='center' container item justifyContent='space-between' key={index} onClick={() => onChangeEndpoint(value)} py='5px' sx={{ ':hover': { bgcolor: 'rgba(186, 40, 130, 0.1)' }, bgcolor: (isSelected && !isAlreadyAuto) || isAutoSelected ? 'rgba(186, 40, 130, 0.2)' : 'transparent', cursor: 'pointer', mb: '1px', pl: '15px', position: 'relative', pr: '5px', width: '100%' }}>
                {isSelected && !hasAutoName && isAlreadyAuto && // to put green dot on the chosen endpoint while in auto mode
                  <span style={{ backgroundColor: '#00FF00', border: `1px solid ${theme.palette.background.default}`, borderRadius: '50%', height: '9px', left: '2px', position: 'absolute', top: '50%px', width: '9px' }} />
                }
                <Typography color={(hasAutoName && !isAlreadyAuto) || (!hasAutoName && isAlreadyAuto) ? 'text.disabled' : 'text.main'} fontSize='16px' fontWeight={isSelected || isAutoSelected ? 500 : 400} textAlign='left' width={isLightClient ? '100%' : '53%'}>
                  {name}
                </Typography>
                {!isLightClient && !hasAutoName &&
                  <NodeStatusAndDelay
                    defaultColor={defaultColor}
                    endpointDelay={delay}
                    isSelected={isSelected}
                  />
                }
                {hasAutoName &&
                  <Switch
                    fontSize='17px'
                    isChecked={isAutoSwitchOn}
                    onChange={noop}
                    theme={theme}
                  />
                }
              </Grid>
              {hasAutoName &&
                <Divider sx={{ bgcolor: 'divider', height: '1px' }} />
              }
            </>
          );
        })}
    </Grid>
  );
};

const ListIndicator = ({ currentDelay, defaultColor, endpointUrl, iconSize, id, isDark, onClick, setCurrentDelay }: ListIndicatorProps) => {
  const isLightClient = endpointUrl?.startsWith('light');
  const onExtension = useIsExtensionPopup();

  useEffect(() => {
    // to reset signal bar on chain change
    setCurrentDelay(undefined);
  }, [endpointUrl, setCurrentDelay]);

  const bgcolorOnAccountDetail: string = useMemo(() => {
    if (onExtension) {
      return 'background.paper';
    } else {
      return 'transparent';
    }
  }, [onExtension]);

  return (
    <Grid aria-describedby={id} component='button' container item onClick={onClick} sx={{ bgcolor: bgcolorOnAccountDetail, border: isDark ? 2 : 1, borderColor: 'divider', borderRadius: '5px', cursor: 'pointer', height: `${iconSize + 7}px`, position: 'relative', width: `${iconSize + 7}px`, zIndex: 10 }}>
      {isLightClient
        ? <LightClientEndpointIcon sx={{ bottom: '2px', color: SIGNAL_COLORS.orange, fontSize: `${iconSize}px`, left: '2px', position: 'absolute' }} />
        : <NodeStatusIcon
          defaultColor={defaultColor}
          iconSize={iconSize}
          ms={currentDelay}
          position='unset'
        />
      }
    </Grid>
  );
};

function RemoteNodeSelectorWithSignals ({ address, iconSize = 35 }: Props): React.ReactElement {
  const theme = useTheme();

  const { endpoint } = useEndpoint(address);
  const genesisHash = useGenesisHash(address);
  const endpointOptions = useEndpoints(genesisHash);
  const isFetching = useRef<Record<string, boolean>>({});

  const [currentDelay, setCurrentDelay] = useState<number | undefined>();
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);
  const [endpointsDelay, setEndpointsDelay] = useState<EndpointsDelay>();

  const isDark = theme.palette.mode === 'dark';
  const DEFAULT_GREY = isDark ? '#747474' : '#E8E0E5';

  useEffect(() => {
    // initialize endpointsDelay by setting all delays to null
    if (!endpointOptions.length) {
      return;
    }

    const mappedEndpoints = endpointOptions.map(({ text, value }) => ({ delay: null, name: text.replace(/^via\s/, ''), value }));

    setEndpointsDelay(mappedEndpoints as EndpointsDelay);
  }, [endpointOptions]);

  const calculateAndSetDelay = useCallback((endpoint: string) => {
    endpoint && CalculateNodeDelay(endpoint)
      .then((response) => {
        if (!response) {
          return;
        }

        isFetching.current[endpoint] = false;
        setCurrentDelay(response.delay);
        setEndpointsDelay((prevEndpoints) => {
          return prevEndpoints?.map((e) => {
            if (e.value === response.endpoint) {
              return { ...e, delay: response.delay };
            }

            return e;
          });
        });

        response.api?.disconnect().catch(console.error); // if we don't need it to be used in the extension we can disconnect it in the function instead
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (endpoint && endpoint !== AUTO_MODE.value && !isFetching.current?.[endpoint]) {
      isFetching.current[endpoint] = true;
      calculateAndSetDelay(endpoint);
    }
  }, [calculateAndSetDelay, endpoint]);

  const onClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;

  return (
    <>
      <ListIndicator
        currentDelay={currentDelay}
        defaultColor={DEFAULT_GREY}
        endpointUrl={endpoint}
        iconSize={iconSize}
        id={id}
        isDark
        onClick={onClick}
        setCurrentDelay={setCurrentDelay}
      />
      <Popover
        PaperProps={{
          sx: { backgroundImage: 'none', bgcolor: 'background.paper', border: '1px solid', borderColor: isDark ? 'secondary.light' : 'transparent', borderRadius: '7px', boxShadow: isDark ? '0px 4px 4px rgba(255, 255, 255, 0.25)' : '0px 0px 25px 0px rgba(0, 0, 0, 0.50)', py: '5px' }
        }}
        anchorEl={anchorEl}
        anchorOrigin={{
          horizontal: 'right',
          vertical: 'bottom'
        }}
        id={id}
        onClose={handleClose}
        open={open}
        sx={{ mt: '5px' }}
        transformOrigin={{
          horizontal: 'right',
          vertical: 'top'
        }}
      >
        <NodesList
          address={address}
          defaultColor={DEFAULT_GREY}
          endpointsDelay={endpointsDelay}
          setCurrentDelay={setCurrentDelay}
          setEndpointsDelay={setEndpointsDelay}
        />
      </Popover>
    </>
  );
}

export default React.memo(RemoteNodeSelectorWithSignals);
