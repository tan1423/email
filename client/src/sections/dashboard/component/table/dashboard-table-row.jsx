import { useNavigate } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';

import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import { Box, Tooltip, IconButton, Typography } from '@mui/material';

import { downloadList } from 'src/redux/slice/listSlice';
import { startVerification } from 'src/redux/slice/uploadSlice';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { usePopover } from 'src/components/custom-popover';


// ----------------------------------------------------------------------

export function DashboardTableRow({
  row,
  selected,
  dashboardTableIndex,
  onOpenPopover,
  onStartVerification,
}) {
  const csvfilesname = [{ name: row.name, numberOfEmails: row.numberOfEmails }];
  const timezone = '(UTC+05:30) Asia/Kolkata';
  const { remainingCredits } = useSelector((state) => state.credits);

  // Get the current file details based on the index
  const currentFile = csvfilesname[dashboardTableIndex % csvfilesname.length];
  const navigate = useNavigate();
  const popover = usePopover();
  const handleViewReport = () => {
    navigate('/app/reports');
    navigate('/app/reports');
  };

  const dispatch = useDispatch();

  const handleStartVerification = () => {
    if (remainingCredits >= row.numberOfEmails) {
      onStartVerification(); // Update local state
      dispatch(startVerification()); // Start verification process
    } else {
      console.log("You don't have enough credits to start verification.");
    }
  };
  const handleDownload = () => {
    dispatch(downloadList({ jobId: row.jobId }));
  };
  const renderPrimary = (
    <TableRow hover selected={selected}>
      <TableCell width={300}>
        <Stack
          spacing={2}
          direction="row"
          alignItems="center"
          sx={{
            typography: 'body2',
            flex: '1 1 auto',
            alignItems: 'flex-start',
          }}
        >
          <Tooltip
            title={`${
              (row.status === 'unprocessed' && 'List is Unprocessed.') ||
              (row.status === 'completed' && 'List is Completed.') ||
              (row.status === 'processing' && 'List is Processing.')
            }`}
            arrow
            placement="top"
            disableInteractive
          >
            <Label
              variant="soft"
              color={
                (row.status === 'unprocessed' && 'error') ||
                (row.status === 'completed' && 'success') ||
                (row.status === 'processing' && 'info') ||
                'default'
              }
            >
              {row.status}
            </Label>
          </Tooltip>
        </Stack>
        <Stack spacing={2} direction="row" alignItems="center">
          <Tooltip
            title={
              <>
                List Name: {currentFile.name} ({currentFile.numberOfEmails})
              </>
            }
            arrow
            placement="top"
            disableInteractive
          >
            <Typography
              component="span"
              fontSize={14}
              sx={{
                mt: '4px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '300px',
              }}
            >
              {currentFile.name} ({currentFile.numberOfEmails})
            </Typography>
          </Tooltip>
        </Stack>
        <Stack spacing={2} direction="row" alignItems="center">
          <Tooltip
            arrow
            placement="top"
            disableInteractive
            title={`List Uploaded: ${row.date}, ${timezone}`}
          >
            <Box
              component="span"
              sx={{
                color: 'text.secondary',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '300px',
                display: 'inline-block',
              }}
            >
              {row.date}
            </Box>
          </Tooltip>
        </Stack>
      </TableCell>

      <TableCell width={200}>
        <Tooltip
          title={
            row.status === 'processing'
              ? 'Verification in progress. Please wait.'
              : row.status === 'completed'
                ? 'Click to download list'
                : 'Click to start verification on list'
          }
          arrow
          placement="top"
          disableInteractive
        >
          <span>
            <Button
              variant="outlined"
              color="primary"
              disabled={row.status === 'processing'}
              onClick={
                row.status === 'processing' || row.status === 'completed'
                  ? handleDownload
                  : handleStartVerification
              }
            >
              {row.status === 'processing' || row.status === 'completed'
                ? row.status === 'completed'
                  ? 'Download'
                  : 'Verification In Progress'
                : 'Start Verification'}
            </Button>
          </span>
        </Tooltip>
      </TableCell>

      <TableCell width={140} align="right">
        <Tooltip
          title={
            row.status === 'completed'
              ? 'Click to view report of list.'
              : 'Verification in progress. Please wait.'
          }
          arrow
          placement="top"
          disableInteractive
        >
          <span>
            <Button
              variant="outlined"
              color="success"
              disabled={row.status === 'unprocessed' || row.status === 'processing'}
              onClick={handleViewReport}
            >
              View Report
            </Button>
          </span>
        </Tooltip>
      </TableCell>
      <TableCell align="right" sx={{ px: 1, whiteSpace: 'nowrap' }}>
        <Tooltip title="Click for more options." arrow placement="top">
          <IconButton
            color={popover.open ? 'inherit' : 'default'}
            onClick={(event) => onOpenPopover(event)}
          >
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );

  return <>{renderPrimary}</>;
}
