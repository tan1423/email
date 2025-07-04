/* eslint-disable consistent-return */
import { useTheme } from '@emotion/react';
import { Helmet } from 'react-helmet-async';
import { useRef, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Box, Alert, Button, Tooltip, Snackbar, useMediaQuery } from '@mui/material';

import axios, { endpoints } from 'src/utils/axios-util';

import { DashboardContent } from 'src/layouts/dashboard';
import { listItems } from 'src/_mock/big-card/_dashboardBigCardListItems';
import { deductCredit, fetchCreditBalance } from 'src/redux/slice/creditSlice';

import { Iconify } from 'src/components/iconify';
import BigCard from 'src/components/big-card/big-card';
import StatsCards from 'src/components/stats-card/stats-card';
import PageHeader from 'src/components/page-header/page-header';

import Upload from 'src/sections/dashboard/component/upload/upload-file';
import { DashboardTable } from 'src/sections/dashboard/component/table/dashboard-table';
import { DashboardChart } from 'src/sections/dashboard/component/chart/dashboard-chart';
import VerifySingleEmail from 'src/sections/dashboard/component/verify-single-email/verify-single-email';

// ----------------------------------------------------------------------

const metadata = { title: `Dashboard | Pabbly Email Verification` };
const { items, style } = listItems;

export default function Page() {
  const uploadComponentRef = useRef(null);

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const [alertState, setAlertState] = useState({
    open: false,
    severity: 'success',
    title: '',
    message: '',
    status: '',
  });
  const processingLists = useSelector((state) => state.list.processingLists);
  const { totalCredits, usedCredits, remainingCredits } = useSelector((state) => state.credits);

  const dispatch = useDispatch();
  const handleAlertClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setAlertState((prev) => ({
      ...prev,
      open: false,
    }));
  };
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const showAlert = (color, title, message, status) => {
    setAlertState({
      open: true,
      color,
      title,
      message,
      status,
    });
  };

  const handleVerify = () => {
    setLoading(true);
    axios
      .post(`${endpoints.list.verifySingle}`, { email })
      .then((res) => {
        dispatch(deductCredit({ amount: 1 }));
        if (res.data.data.result === 'deliverable') {
          setAlertState({
            open: true,
            severity: 'success',
            status: 'Accept All',
            message: `The email "${email}" is valid!`,
            title: 'Verification Result',
          });
        } else {
          setAlertState({
            open: true,
            severity: 'error',
            status: 'Undeliverable',
            message: `${res.data.data.result}`,
            title: 'Verification Result',
          });
        }
      })
      .catch((err) => {
        setAlertState({
          open: true,
          severity: 'error',
          status: '',
          message: `${err.message}`,
          title: '',
        });
      })
      .finally(() => {
        setLoading((prev) => !prev);
        setEmail('');
      });
  };

  useEffect(() => {
    if (!totalCredits) {
      dispatch(fetchCreditBalance());
    }
  }, [totalCredits, dispatch]);
  const scrollToUpload = () => {
    uploadComponentRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
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
            mb: 0,
          }}
        >
          <PageHeader
            title="Dashboard"
            Subheading="Enhance your email list quality with advanced verification tools, reducing bounce rates and maximizing deliverability."
            link_added="https://forum.pabbly.com/forums/general-discussions.39/"
          />
          <Tooltip
            title="Start verifying email addresses from the list."
            arrow
            placement="top"
            disableInteractive
          >
            <Button
              // onClick={buttonClick}
              onClick={scrollToUpload}
              sx={{ mt: isMobile ? 2 : 0 }}
              startIcon={
                <Iconify icon="heroicons:plus-circle-16-solid" style={{ width: 18, height: 18 }} />
              }
              size="large"
              variant="contained"
              color="primary"
            >
              Upload File
            </Button>
          </Tooltip>
        </Box>
        <Box
          width="100%"
          sx={{
            mt: '40px',
            mb: '24px',
            gap: 3,
            display: 'grid',
            flexWrap: 'wrap',
            gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: 'repeat(3, 1fr)' },
          }}
        >
          <StatsCards
            cardtitle="Email Credits Allotted"
            cardstats={totalCredits}
            icon_name="2card.png"
            icon_color="#FFA92E"
            bg_gradient="#FFA92E"
            tooltipTittle="Number of credits alloted to your account."
          />
          <StatsCards
            cardtitle="Email Credits Consumed"
            cardstats={usedCredits}
            icon_name="Processed.svg"
            icon_color="#10CBF3"
            bg_gradient="#10CBF3"
            tooltipTittle="Number of credits consumed by your account."
          />
          <StatsCards
            cardtitle="Email Credits Remaining"
            cardstats={remainingCredits}
            icon_name="Complete.svg"
            icon_color="#1D88FA"
            bg_gradient="#1D88FA"
            tooltipTittle="Number of credits remaining in your account."
          />
        </Box>
        <Box width="100%">
          <Box>
            <BigCard
              tooltip="View file upload guidelines for email verification."
              getHelp={false}
              isVideo
              bigcardtitle="Upload Guidelines"
              bigcardsubtitle="Please adhere to the following guidelines when uploading your CSV file:"
              style={style}
              items={items}
              videoLink="https://www.youtube.com/embed/MIcaDmC_ngM?si=EJ1SGtn0tdF96b1y"
              thumbnailName="email-verication-video-thumbnail.jpg"
              keyword="Note:"
              bigcardNote="All data and reports older than 15 days will be permanently removed automatically. For reference, you can Download Sample File to guide you in formatting your data correctly."
              action={
                <Tooltip
                  title="Start verifying email addresses from the list."
                  arrow
                  placement="top"
                  disableInteractive
                >
                  <Button
                    // onClick={buttonClick}
                    onClick={scrollToUpload}
                    startIcon={
                      <Iconify
                        icon="heroicons:plus-circle-16-solid"
                        style={{ width: 18, height: 18 }}
                      />
                    }
                    sx={{ mt: 3 }}
                    variant="outlined"
                    color="primary"
                    size="large"
                  >
                    Upload File
                  </Button>
                </Tooltip>
              }
            />
          </Box>
        </Box>
        <Box
          sx={{
            display: 'flex',
            width: '100%',
            gap: 3,
            flexDirection: { xs: 'column', md: 'row' },
            mt: 3,
          }}
        >
          <Box sx={{ width: '100%' }}>
            <VerifySingleEmail
              onVerify={handleVerify}
              email={email}
              setEmail={setEmail}
              loading={loading}
            />
          </Box>
          <Box sx={{ width: '100%' }} ref={uploadComponentRef}>
            <Upload setAlertState={setAlertState} />
          </Box>
        </Box>

        <Box
          sx={{
            mt: 3,
            width: '100%',
            display: 'flex',
            gap: 3,
            flexDirection: { xs: 'column', md: 'row' },
          }}
        >
          <Box sx={{ width: { xs: '100%', md: '65%', zIndex: 99 } }}>
            <DashboardTable />
          </Box>
          <Box sx={{ width: { xs: '100%', md: '35%' } }}>
            <DashboardChart
              showAlert={showAlert}
              handleAlertClose={handleAlertClose}
              title="List_name.csv"
              chart={{
                series: [
                  { label: 'Deliverable', value: 12244 },
                  { label: 'Undeliverable', value: 53345 },
                  { label: 'Accept-all', value: 44313 },
                  { label: 'Unknown', value: 78343 },
                ],
              }}
            />
          </Box>
        </Box>
      </DashboardContent>

      <Snackbar
        open={alertState.open}
        autoHideDuration={2500}
        onClose={handleAlertClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{
          boxShadow: '0px 8px 16px 0px rgba(145, 158, 171, 0.16)',
          zIndex: theme.zIndex.modal + 9999,
        }}
      >
        <Alert
          onClose={handleAlertClose}
          severity={alertState.severity}
          sx={{
            width: '100%',
            fontSize: '14px',
            fontWeight: 'bold',
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary, // Keeping text color consistent
            '& .MuiAlert-icon': {
              color:
                alertState.severity === 'error'
                  ? theme.palette.error.main
                  : theme.palette.success.main,
            },
          }}
        >
          {alertState.message}
        </Alert>
      </Snackbar>
    </>
  );
}
