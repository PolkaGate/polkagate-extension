// Copyright 2019-2023 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable react/jsx-max-props-per-line */

import '@vaadin/icons';

import { Breadcrumbs, Container, Grid, Link, Typography, useTheme } from '@mui/material';
import { CubeGrid, Wordpress } from 'better-react-spinkit';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router';
import { useHistory, useLocation } from 'react-router-dom';

import { useApi, useChainName, useDecidingCount, useFullscreen, useTracks, useTranslation } from '../../hooks';
import { LATEST_REFERENDA_LIMIT_TO_LOAD_PER_REQUEST, REFERENDA_STATUS } from './utils/consts';
import { getLatestReferendums, getReferendumsListSb, getTrackOrFellowshipReferendums, Statistics } from './utils/helpers';
import { LatestReferenda, TopMenu } from './utils/types';
import { AllReferendaStats } from './AllReferendaStats';
import { Header } from './Header';
import { ReferendumSummary } from './ReferendumSummary';
import SearchBox from './SearchBox';
import Toolbar from './Toolbar';
import { TrackStats } from './TrackStats';

export default function Governance(): React.ReactElement {
  const { t } = useTranslation();
  const { state } = useLocation();
  const history = useHistory();
  const theme = useTheme();
  const { address, postId } = useParams<{ address: string, postId?: string }>();

  useFullscreen();
  const api = useApi(address);
  const { fellowshipTracks, tracks } = useTracks(address);
  const chainName = useChainName(address);
  const pageTrackRef = useRef({ listFinished: false, page: 1, topMenu: 'Referenda', trackId: undefined });
  const decidingCounts = useDecidingCount(address);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedTopMenu, setSelectedTopMenu] = useState<TopMenu>('Referenda');
  const [selectedSubMenu, setSelectedSubMenu] = useState<string>(state?.selectedSubMenu || 'All');
  const [referendumCount, setReferendumCount] = useState<number | undefined>();
  const [referendumStats, setReferendumStats] = useState<Statistics | undefined>();
  const [referendaToList, setReferenda] = useState<LatestReferenda[] | null>();
  const [filteredReferenda, setFilteredReferenda] = useState<LatestReferenda[] | null>();
  const [getMore, setGetMore] = useState<number | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>();
  const [filterState, setFilterState] = useState(0);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const currentTrack = useMemo(() => {
    if (!tracks || !fellowshipTracks) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return tracks.concat(fellowshipTracks).find((t) =>
      String(t[1].name) === selectedSubMenu.toLowerCase().replace(' ', '_') ||
      String(t[1].name) === selectedSubMenu.toLowerCase() // fellowship tracks have no underscore!
    );
  }, [fellowshipTracks, selectedSubMenu, tracks]);

  useEffect(() => {
    if (referendaToList === undefined) {
      return;
    }

    if (referendaToList === null) {
      setFilteredReferenda(null);

      return;
    }

    const list = filterState ? referendaToList?.filter((ref) => REFERENDA_STATUS[filterState].includes(ref.status)) : referendaToList;

    setFilteredReferenda(list);
  }, [filterState, referendaToList]);

  useEffect(() => {
    if (!api) {
      return;
    }

    if (!api.consts.referenda || !api.query.referenda) {
      console.log('OpenGov is not supported on this chain');

      return;
    }

    console.log('Maximum size of the referendum queue for a single track:', api.consts.referenda.maxQueued.toString());
    console.log('minimum amount to be used as a deposit :', api.consts.referenda.submissionDeposit.toString());
    console.log('blocks after submission that a referendum must begin decided by.', api.consts.referenda.undecidingTimeout.toString());

    api.query.referenda.referendumCount().then((count) => {
      console.log('total referendum count:', count.toNumber());
      setReferendumCount(count?.toNumber());
    }).catch(console.error);

    // const trackId_mediumSpender = 33;
    // api.query.referenda.trackQueue(trackId_mediumSpender).then((res) => {
    //   console.log('trackQueue for trackId_mediumSpender:', res.toString());
    // }).catch(console.error);
  }, [api]);

  useEffect(() => {
    // to view the referenda at the first page load
    // if (chainName && selectedSubMenu === 'All') {
    //   setReferenda(undefined);
    //   // eslint-disable-next-line no-void
    //   void getLatestReferendums(chainName).then((res) => setReferenda(res));
    // }

  }, []);

  const getReferendaById = useCallback((postId: number, type: 'ReferendumV2' | 'FellowshipReferendum') => {
    history.push({
      pathname: `/governance/${address}/${type === 'ReferendumV2' ? 'Referenda' : 'Fellowship'}/${postId}`,
      state: { selectedSubMenu, selectedTopMenu }
    });
  }, [address, history, selectedSubMenu, selectedTopMenu]);

  useEffect(() => {
    if (!chainName || !selectedSubMenu || !selectedTopMenu) {
      return;
    }

    const trackId = tracks?.find((t) => String(t[1].name) === selectedSubMenu.toLowerCase().replace(' ', '_'))?.[0]?.toNumber();
    let list = referendaToList;

    // to reset referenda list on menu change
    if (pageTrackRef.current.trackId !== trackId || pageTrackRef.current.topMenu !== selectedTopMenu) {
      setReferenda(undefined);
      list = [];
      pageTrackRef.current.trackId = trackId; // Update the ref with new values
      pageTrackRef.current.page = 1;
      pageTrackRef.current.listFinished = false;
    }

    if (pageTrackRef.current.page > 1) {
      setIsLoading(true);
    }

    pageTrackRef.current.topMenu = selectedTopMenu;

    if (selectedTopMenu === 'Referenda' && selectedSubMenu === 'All') {
      getLatestReferendums(chainName, pageTrackRef.current.page * LATEST_REFERENDA_LIMIT_TO_LOAD_PER_REQUEST).then((res) => {
        setIsLoading(false);

        if (res === null) {
          if (pageTrackRef.current.page === 1) { // there is no referendum !!
            setReferenda(null);

            return;
          }

          pageTrackRef.current.listFinished = true;

          return;
        }

        setReferenda(res);
      }).catch(console.error);

      return;
    }

    getTrackOrFellowshipReferendums(chainName, pageTrackRef.current.page, trackId).then((res) => {
      setIsLoading(false);

      if (res === null) {
        if (pageTrackRef.current.page === 1) { // there is no referendum for this track
          setReferenda(null);

          return;
        }

        pageTrackRef.current.listFinished = true;

        return;
      }

      getReferendumsListSb(chainName, selectedTopMenu, pageTrackRef.current.page * LATEST_REFERENDA_LIMIT_TO_LOAD_PER_REQUEST).then((sbRes) => {
        console.log('sbRes:', sbRes);
      }).catch(console.error);

      const concatenated = (list || []).concat(res);

      setReferenda([...concatenated]);
    }).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainName, getMore, selectedSubMenu, tracks, selectedTopMenu]);

  const backToTopMenu = useCallback((event) => {
    setSelectedSubMenu('All');
  }, []);

  const getMoreReferenda = useCallback(() => {
    pageTrackRef.current = { ...pageTrackRef.current, page: pageTrackRef.current.page + 1 };
    setGetMore(pageTrackRef.current.page);
  }, [pageTrackRef]);

  const Bread = () => (
    <Grid container sx={{ py: '10px' }}>
      <Breadcrumbs aria-label='breadcrumb' color='text.primary'>
        <Link onClick={backToTopMenu} sx={{ cursor: 'pointer', fontWeight: 500 }} underline='hover'>
          {selectedTopMenu || 'Referenda'}
        </Link>
        <Typography color='text.primary' sx={{ fontWeight: 500 }}>
          {selectedSubMenu || 'All'}
        </Typography>
      </Breadcrumbs>
    </Grid>
  );

  const HorizontalWaiting = ({ color }: { color: string }) => (
    <div>
      <Wordpress color={color} timingFunction='linear' />
      <Wordpress color={color} timingFunction='ease' />
      <Wordpress color={color} timingFunction='ease-in' />
      <Wordpress color={color} timingFunction='ease-out' />
      <Wordpress color={color} timingFunction='ease-in-out' />
    </div>
  );

  return (
    <>
      <Header />
      <Toolbar
        address={address}
        decidingCounts={decidingCounts}
        menuOpen={menuOpen}
        selectedTopMenu={selectedTopMenu || 'Referenda'}
        setMenuOpen={setMenuOpen}
        setSelectedSubMenu={setSelectedSubMenu}
        setSelectedTopMenu={setSelectedTopMenu}
      />
      <Container disableGutters sx={{ maxWidth: 'inherit' }}>
        <Bread />
        <Container disableGutters sx={{ maxHeight: parent.innerHeight - 170, maxWidth: 'inherit', opacity: menuOpen ? 0.3 : 1, overflowY: 'scroll', position: 'fixed', top: 160 }}>
          {selectedSubMenu === 'All'
            ? <AllReferendaStats address={address} referendumStats={referendumStats} setReferendumStats={setReferendumStats} />
            : <TrackStats
              address={address}
              decidingCounts={decidingCounts}
              selectedSubMenu={selectedSubMenu}
              selectedTopMenu={selectedTopMenu}
              track={currentTrack}
            />
          }
          <SearchBox
            address={address}
            api={api}
            filterState={filterState}
            referendaToList={referendaToList}
            setFilterState={setFilterState}
            setFilteredReferenda={setFilteredReferenda}
            tracks={tracks}
          />
          {filteredReferenda
            ? <>
              {filteredReferenda.map((referendum, index) => {
                if (referendum?.post_id < (referendumCount || referendumStats?.OriginsCount)) {
                  return (
                    <ReferendumSummary address={address} key={index} onClick={() => getReferendaById(referendum.post_id, referendum.type)} referendum={referendum} />
                  );
                }
              })}
              {!pageTrackRef.current.listFinished &&
                <>
                  {
                    !isLoading
                      ? <Grid container item justifyContent='center' sx={{ pb: '15px', '&:hover': { cursor: 'pointer' } }}>
                        <Typography color='secondary.contrastText' fontSize='18px' fontWeight={600} onClick={getMoreReferenda}>
                          {t('{{count}} referenda loaded. Click here to load more', { replace: { count: LATEST_REFERENDA_LIMIT_TO_LOAD_PER_REQUEST * pageTrackRef.current.page } })}
                        </Typography>
                      </Grid>
                      : isLoading && <Grid container justifyContent='center'>
                        <HorizontalWaiting color={theme.palette.primary.main} />
                      </Grid>
                  }
                </>
              }
            </>
            : filteredReferenda === null
              ? <Grid container justifyContent='center' pt='10%'>
                <Typography color={'text.disabled'} fontSize={20} fontWeight={500}>
                  {t('No referenda in this track to display')}
                </Typography>
              </Grid>
              : <Grid container justifyContent='center' pt='10%'>
                <CubeGrid col={3} color={theme.palette.secondary.main} row={3} size={200} style={{ opacity: '0.4' }} />
              </Grid>
          }
        </Container>
      </Container>
    </>
  );
}
