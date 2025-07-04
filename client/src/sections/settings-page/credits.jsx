import { useEffect } from 'react';
import { useTheme } from '@emotion/react';
import { Helmet } from 'react-helmet-async';
import { useDispatch, useSelector } from 'react-redux';

import { Box, useMediaQuery } from '@mui/material';

import { fetchCreditBalance } from 'src/redux/slice/creditSlice';

import StatsCards from 'src/components/stats-card/stats-card';

import { CreditTable } from '../credit-table/credit-table';

const metadata = { title: `Pabbly Email Verification | Credits ` };

export default function ThreePage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch = useDispatch();
  const { totalCredits, usedCredits, remainingCredits } = useSelector((state) => state.credits);
  const { user, status } = useSelector((state) => state.user);

  
  useEffect(() => {
  if (
    user && 
    user.emailVerified && 
    !totalCredits && 
    status === 'succeeded' // or 'authenticated' based on your logic
  ) {
    dispatch(fetchCreditBalance());
  }
}, [user, totalCredits, dispatch, status]);

  const stats = {
    allotted: totalCredits || 0,
    consumed: usedCredits || 0,
    remaining: remainingCredits || 0,
  };

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

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
          cardstats={stats.allotted}
          icon_name="2card.png"
          icon_color="#FFA92E"
          bg_gradient="#FFA92E"
          tooltipTittle="Number of credits alloted to your account."
        />
        <StatsCards
          cardtitle="Email Credits Consumed"
          cardstats={stats.consumed}
          icon_name="Processed.svg"
          icon_color="#10CBF3"
          bg_gradient="#10CBF3"
          tooltipTittle="Number of credits consumed by your account."
        />
        <StatsCards
          cardtitle="Email Credits Remaining"
          cardstats={stats.remaining}
          icon_name="Complete.svg"
          icon_color="#1D88FA"
          bg_gradient="#1D88FA"
          tooltipTittle="Number of credits remaining to your account."
        />
      </Box>

      <CreditTable />
    </>
  );
}
