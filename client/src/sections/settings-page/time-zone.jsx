import debounce from 'lodash/debounce';
import { useTheme } from '@emotion/react';
import { useDispatch, useSelector } from 'react-redux';
import React, { useRef, useMemo, useState, useEffect } from 'react';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Card,
  Alert,
  Select,
  Divider,
  Tooltip,
  MenuItem,
  Snackbar,
  TextField,
  CardHeader,
  InputLabel,
  FormControl,
  InputAdornment,
  FormHelperText,
} from '@mui/material';

import { saveTimeZone, fetchTimeZones, setSelectedTimeZone } from 'src/redux/slice/timeZoneSlice';

import { Iconify } from 'src/components/iconify';

export default function TimeZonePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef(null);
  const theme = useTheme();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const { timeZones, selectedTimeZone } = useSelector((state) => state.timeZone);
  const dispatch = useDispatch();

  // Memoize filtered timezones
  const filteredTimeZones = useMemo(() => {
    if (!searchTerm) return timeZones;
    const searchLower = searchTerm.toLowerCase();
    return timeZones.filter((tz) => tz.display.toLowerCase().includes(searchLower));
  }, [timeZones, searchTerm]);

  // Debounced search handler
  const debouncedSearchHandler = useMemo(
    () =>
      debounce((value) => {
        setSearchTerm(value);
      }, 300),
    []
  );

  // Cleanup debounce on unmount
  useEffect(() => () => debouncedSearchHandler.cancel(), [debouncedSearchHandler]);

  const handleSave = () => {
    dispatch(saveTimeZone(selectedTimeZone)); // Save to the backend
    // Show the snackbar
    setSnackbarOpen(true);
    // Close the dialog after a short delay
    setTimeout(() => {}, 500);
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  const handleTimeZoneChange = (event) => {
    const selectedTz = timeZones.find((tz) => tz.key === event.target.value);
    if (selectedTz) {
      dispatch(setSelectedTimeZone(selectedTz));
    }
  };

  const handleSearchChange = (event) => {
    debouncedSearchHandler(event.target.value);
  };

  useEffect(() => {
    dispatch(fetchTimeZones());
  }, [dispatch]);

  // Memoize MenuProps to prevent unnecessary re-renders
  const menuProps = useMemo(
    () => ({
      PaperProps: {
        sx: {
          p: '0px 0px 4px 4px',
          maxHeight: '450px',
          width: { xs: '90vw', sm: '250px' },
          bgcolor: 'background.paper',
          '& .MuiList-root': {
            p: 0,
            maxHeight: '400px',
            position: 'relative',
            overflow: 'auto',
          },
          '& .MuiMenuItem-root': {
            whiteSpace: 'normal',
            wordBreak: 'break-word',
            py: 1,
          },
        },
      },
      transformOrigin: { horizontal: 'left', vertical: 'top' },
      anchorOrigin: { horizontal: 'left', vertical: 'bottom' },
    }),
    []
  );

  return (
    <>
      <Card sx={{ boxShadow: '0px 12px 24px -4px rgba(145, 158, 171, 0.2)', mb: 55 }}>
        <CardHeader
          title={
            <Box>
              <Box sx={{ typography: 'subtitle2', fontSize: '18px', fontWeight: 600 }}>
                <Tooltip
                  title="Choose the time zone for your account. All the date and time in your account will align with the time zone that you set here."
                  arrow
                  placement="top"
                >
                  <span>Time Zone</span>
                </Tooltip>
              </Box>
            </Box>
          }
          sx={{ p: 3 }}
        />
        <Divider />

        <Box sx={{ p: 3 }}>
          <FormControl fullWidth sx={{ mb: 2, maxWidth: { xs: '100%', sm: 838 } }}>
            <InputLabel id="time-zone-select-label">Select Time Zone</InputLabel>

            <Select
              labelId="time-zone-select-label"
              id="time-zone-select"
              label="Select Time Zone"
              value={selectedTimeZone.key}
              onChange={handleTimeZoneChange}
              MenuProps={menuProps}
            >
              <Box
                sx={{
                  p: 2,
                  position: 'sticky',
                  top: 0,
                  bgcolor: 'background.paper',
                  zIndex: 999,
                  width: '100%',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <TextField
                  fullWidth
                  size="large"
                  placeholder="Search Time Zone"
                  onChange={handleSearchChange}
                  inputRef={searchInputRef}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Iconify icon="eva:search-fill" width={24} height={24} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              {filteredTimeZones.map((tz, index) => (
                <MenuItem key={`${tz.key}-${index}`} value={tz.key}>
                  {tz.display}
                </MenuItem>
              ))}
            </Select>

            <FormHelperText>View log times based on selected time zone.</FormHelperText>
          </FormControl>

          <Box>
            <Tooltip
              title="Click 'Save' to apply the selected time zone to your account for list activities and verifications."
              arrow
              placement="top"
            >
              <LoadingButton variant="contained" color="primary" onClick={handleSave}>
                Save
              </LoadingButton>
            </Tooltip>
          </Box>
        </Box>
      </Card>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={1000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{
          boxShadow: '0px 8px 16px 0px rgba(145, 158, 171, 0.16)',
        }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity="success"
          sx={{
            width: '100%',
            fontSize: '14px',
            fontWeight: 'bold',
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
          }}
        >
          Time Zone Updated Successfully!
        </Alert>
      </Snackbar>
    </>
  );
}
