import { useState } from 'react';
import { useTheme } from '@emotion/react';
import { Helmet } from 'react-helmet-async';

import { Box, Tooltip, useMediaQuery } from '@mui/material';

import { CONFIG } from 'src/config-global';
import { DashboardContent } from 'src/layouts/app';
import { listItemsLists } from 'src/_mock/big-card/_dashboardBigCardListItems';

import BigCard from 'src/components/big-card/big-card';
import StatsCards from 'src/components/stats-card/stats-card';
import PageHeader from 'src/components/page-header/page-header';

import { EmailListTable } from 'src/sections/email-lists/components/table/email-lists-table';
import UpdateCreditsDialog from 'src/sections/email-lists/components/dialog/credit-update-dialog';

// ----------------------------------------------------------------------

const metadata = { title: `Email Lists | ${CONFIG.site.name}` };
const { items, style } = listItemsLists;

export default function Page() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [updateCreditsDialogOpen, setUpdateCreditsDialogOpen] = useState(false);
  const [selectedCreditRow, setSelectedCreditRow] = useState(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [dialogMode, setDialogMode] = useState('add');

  // Modified handler for opening dialog
  const handleOpenDialog = (plan = null) => {
    setSelectedPlan(plan);
    setDialogMode(plan ? 'edit' : 'add');
    setIsDialogOpen(true);
  };
  const handleUpdateCreditsClick = (row) => {
    setSelectedCreditRow(row);
    setUpdateCreditsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedPlan(null);
    setDialogMode('add');
  };

  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <DashboardContent maxWidth="xl">
        <Box
          sx={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'flex-start' : 'center',
            justifyContent: 'space-between',
            mb: 5,
          }}
        >
          <PageHeader
            title="Email Lists"
            Subheading="Access and manage all email lists uploaded by Pabbly customers, with the ability to view detailed information about individual customers."
            link_added="#"
          />
        </Box>
        <Box
          sx={{
            mb: '24px',
            gap: 3,
            display: 'grid',
            flexWrap: 'wrap',
            gridTemplateColumns: {
              xs: 'repeat(1, 1fr)',
              sm: 'repeat(2, 1fr)',
              xl: 'repeat(4, 1fr)',
            },
          }}
        >
          <Tooltip
            title="Total number of email lists uploaded by the Pabbly customer."
            arrow
            placement="top"
          >
            <div>
              <StatsCards
                cardtitle="Total Email Lists"
                cardstats="5"
                icon_name="mail.svg"
                icon_color="#FFA92E"
                bg_gradient="#FFA92E"
              />
            </div>{' '}
          </Tooltip>

          <Tooltip title="Total number of email lists verified." arrow placement="top">
            <div>
              <StatsCards
                cardtitle="Verified Email Lists"
                cardstats="1"
                icon_name="verified.svg"
                icon_color="#28A645"
                bg_gradient="#22C55E"
              />
            </div>
          </Tooltip>
          <Tooltip title="Total number of email lists unverified." arrow placement="top">
            <div>
              <StatsCards
                cardtitle="Unverified Email Lists"
                cardstats="1"
                icon_name="unverified.svg"
                icon_color="#B71D18"
                bg_gradient="#B71D18"
              />
            </div>
          </Tooltip>
          <Tooltip
            title="Total number of email lists that is under verification process."
            arrow
            placement="top"
          >
            <div>
              <StatsCards
                cardtitle="Under Process Email Lists"
                cardstats="1"
                icon_name="process.svg"
                icon_color="#1D88FA"
                bg_gradient="#1D88FA"
              />
            </div>{' '}
          </Tooltip>
        </Box>
        <Box width="100%" sx={{ mb: '24px' }}>
          <Box>
            <BigCard
              getHelp={false}
              isVideo
              bigcardtitle="Points To Remember!"
              buttontitle="Add WhatsApp Number"
              style={style}
              items={items}
              videoLink="https://www.youtube.com/embed/S-gpjyxqRZo?si=RraJU_Q1ht71Pk2T"
              thumbnailName="Pabbly PEV admin.png"
            />
          </Box>
        </Box>

        <EmailListTable />
        <UpdateCreditsDialog
          open={updateCreditsDialogOpen}
          onClose={() => setUpdateCreditsDialogOpen(false)}
          rowData={selectedCreditRow}
        />
      </DashboardContent>
    </>
  );
}
