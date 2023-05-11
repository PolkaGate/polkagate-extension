// Copyright 2019-2023 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable react/jsx-max-props-per-line */

import { Breadcrumbs, Container, Grid, Link, Typography } from '@mui/material';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { useHistory, useLocation } from 'react-router-dom';

import { PButton } from '../../../components';
import { useApi, useChainName, useDecidingCount, useFullscreen, useTrack, useTranslation } from '../../../hooks';
import { Header } from '../Header';
import Toolbar from '../Toolbar';
import { getReferendum, getReferendumFromSubscan } from '../utils/helpers';
import { Proposal, ReferendumPolkassembly, ReferendumSubScan, TopMenu } from '../utils/types';
import { pascalCaseToTitleCase, toTitleCase } from '../utils/util';
import CastVote from './castVote/CastVote';
import Chronology from './Chronology';
import Comments from './Comments';
import Description from './Description';
import MetaData from './MetaData';
import MyVote from './myVote';
import StatusInfo from './StatusInfo';
import Support from './Support';
import Voting from './Voting';

export default function ReferendumPost(): React.ReactElement {
  const { t } = useTranslation();
  const { address, postId } = useParams<{ address?: string | undefined, postId?: string | undefined }>();
  const history = useHistory();
  const { state } = useLocation();
  const api = useApi(address);
  const decidingCounts = useDecidingCount(address);
  const chainName = useChainName(address);

  useFullscreen();
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedTopMenu, setSelectedTopMenu] = useState<TopMenu>(state?.selectedTopMenu);
  const [selectedSubMenu, setSelectedSubMenu] = useState<string>();
  const [referendumFromPA, setReferendum] = useState<ReferendumPolkassembly>();
  const [referendumFromSb, setReferendumFromSb] = useState<ReferendumSubScan>();
  const [currentTreasuryApprovalList, setCurrentTreasuryApprovalList] = useState<Proposal[]>();
  const [showCastVote, setShowCastVote] = useState<boolean>(false);

  const trackName = useMemo((): string | undefined => {
    const name = ((state?.selectedSubMenu !== 'All' && state?.selectedSubMenu) || referendumFromSb?.origins || referendumFromPA?.origin) as string | undefined;

    return name && toTitleCase(name);
  }, [referendumFromPA?.origin, referendumFromSb?.origins, state?.selectedSubMenu]);

  const track = useTrack(address, trackName);

  useEffect(() => {
    if (!api) {
      return;
    }

    api.query.treasury.approvals().then((approvals) => {
      if (approvals.toJSON().length) {
        const approvalsIds = approvals.toJSON();

        Promise.all(
          approvals.toJSON().map((index) => api.query.treasury.proposals(index))
        ).then((res) => {
          let proposals = JSON.parse(JSON.stringify(res)) as Proposal[];

          proposals = proposals.map((p, index) => {
            p.id = approvalsIds[index] as number;

            return p;
          });

          setCurrentTreasuryApprovalList(proposals);
        }).catch(console.error);
      }
    }).catch(console.error);
  }, [api]);

  useEffect(() => {
    selectedSubMenu && history.push({
      pathname: `/governance/${address}`,
      state: { selectedSubMenu }
    });
  }, [address, history, selectedSubMenu]);

  useEffect(() => {
    chainName && postId && getReferendum(chainName, postId).then((res) => {
      setReferendum(res);
    });

    chainName && postId && getReferendumFromSubscan(chainName, postId).then((res) => {
      setReferendumFromSb(res);
    });
  }, [chainName, postId]);

  const backToTopMenu = useCallback(() => {
    setSelectedSubMenu('All');
  }, []);

  const backToSubMenu = useCallback(() => {
    setSelectedSubMenu(state?.selectedSubMenu || pascalCaseToTitleCase(referendumFromPA?.origin)?.trim());
  }, [referendumFromPA?.origin, state?.selectedSubMenu]);

  const onCastVote = useCallback(() =>
    setShowCastVote(true)
    , []);

  const Bread = () => (
    <Grid container sx={{ py: '10px' }}>
      <Breadcrumbs aria-label='breadcrumb' color='text.primary'>
        <Link onClick={backToTopMenu} sx={{ cursor: 'pointer', fontWeight: 500 }} underline='hover'>
          {selectedTopMenu || 'Referenda'}
        </Link>
        <Link onClick={backToSubMenu} sx={{ cursor: 'pointer', fontWeight: 500 }} underline='hover'>
          {state?.selectedSubMenu || pascalCaseToTitleCase(referendumFromPA?.origin)}
        </Link>
        <Typography color='text.primary' sx={{ fontWeight: 500 }}>
          {`Referendum #${postId}`}
        </Typography>
      </Breadcrumbs>
    </Grid>
  );

  const isOngoing = useMemo(() =>
    !['Executed', 'Rejected'].includes(referendumFromSb?.status) ||
    !['Executed', 'Rejected'].includes(referendumFromPA?.status)
    , [referendumFromSb, referendumFromPA]);

  return (
    <>
      <Header />
      <Toolbar
        address={address}
        decidingCounts={decidingCounts}
        menuOpen={menuOpen}
        selectedTopMenu={selectedTopMenu}
        setMenuOpen={setMenuOpen}
        setSelectedSubMenu={setSelectedSubMenu}
        setSelectedTopMenu={setSelectedTopMenu}
      />
      <Container disableGutters sx={{ maxWidth: 'inherit' }}>
        <Bread />
        <Container disableGutters sx={{ maxHeight: parent.innerHeight - 170, maxWidth: 'inherit', opacity: menuOpen ? 0.3 : 1, overflowY: 'scroll', position: 'fixed', top: 160 }}>
          <Grid container justifyContent='space-between'>
            <Grid container item md={8.9} sx={{ height: '100%' }}>
              <Description
                address={address}
                currentTreasuryApprovalList={currentTreasuryApprovalList}
                referendum={referendumFromPA}
              />
              <Chronology
                address={address}
                currentTreasuryApprovalList={currentTreasuryApprovalList}
                referendum={referendumFromPA}
              />
              <MetaData
                address={address}
                referendum={referendumFromPA}
              />
              <Comments
                address={address}
                referendum={referendumFromPA}
              />
            </Grid>
            <Grid container item md={2.9} sx={{ height: '100%', maxWidth: '450px' }}>
              <StatusInfo
                address={address}
                isOngoing={isOngoing}
                referendumFromSb={referendumFromSb}
                track={track}
              />
              <Voting
                address={address}
                referendumFromPA={referendumFromPA}
                referendumInfoFromSubscan={referendumFromSb}
              />
              <Support
                address={address}
                referendumFromPA={referendumFromPA}
                referendumFromSb={referendumFromSb}
              />
              {isOngoing &&
                <Grid item sx={{ my: '15px' }} xs={12}>
                  <PButton
                    _ml={0}
                    _mt='1px'
                    _onClick={onCastVote}
                    _width={100}
                    text={t<string>('Cast Vote')}
                  />
                </Grid>
              }
              <MyVote
                address={address}
                referendumFromSb={referendumFromSb}
              />
            </Grid>
          </Grid>
        </Container>
      </Container>
      {showCastVote &&
        <CastVote
          address={address}
          open={showCastVote}
          referendumInfo={referendumFromSb}
          setOpen={setShowCastVote}
        />
      }
    </>
  );
}
