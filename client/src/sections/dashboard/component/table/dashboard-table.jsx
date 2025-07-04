import { useTheme } from '@emotion/react';
import { useDispatch, useSelector } from 'react-redux';
import { useState, useEffect, useCallback } from 'react';

import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import {
  Alert,
  Button,
  Divider,
  Tooltip,
  MenuList,
  MenuItem,
  Snackbar,
  CardHeader,
  Typography,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import { useSetState } from 'src/hooks/use-set-state';

import { fIsBetween } from 'src/utils/format-time-util';
import { convertToTimezone } from 'src/utils/date-utils';

import { varAlpha } from 'src/theme/styles';
import { DASHBOARD_STATUS_OPTIONS } from 'src/_mock/_table/_dashboard';
import {
  deleteList,
  fetchLists,
  pollJobStatus,
  fetchChartValues,
  startBulkVerification,
} from 'src/redux/slice/listSlice';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';
import { ConfirmDialog } from 'src/components/confirm-dialog';
import {
  useTable,
  rowInPage,
  emptyRows,
  TableNoData,
  getComparator,
  TableEmptyRows,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { DashboardTableRow } from './dashboard-table-row';
import { DashboardTableToolbar } from './dashboard-table-toolbar';
import { DashboardTableFiltersResult } from './dashboard-table-filters-result';

// ----------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: 'all', label: 'All', tooltip: 'Click here to view all list.' },
  ...DASHBOARD_STATUS_OPTIONS,
];

const TABLE_HEAD = [
  {
    id: 'filename',
    label: 'Status/Name/Date',
    width: 'flex',
    whiteSpace: 'nowrap',
    tooltip: 'View list status, name and date of creation here.',
  },

  {
    id: 'action',
    label: 'Action',
    width: 220,
    whiteSpace: 'nowrap',
    tooltip: 'Take actions on the list here.',
  },

  {
    id: 'report',
    label: 'Report',
    width: 'flex',
    whiteSpace: 'nowrap',
    align: 'right',
    tooltip: 'View any list report here.',
  },
  { id: '', width: 10 },
];

function transformData(data, selectedTimeZone) {
  return data.map((item) => ({
    status: item.status.toLowerCase(),
    name: item.listName,
    numberOfEmails: item.totalEmails,
    date: convertToTimezone(item.createdAt, selectedTimeZone),
    id: item._id,
    jobId: item.jobId,
  }));
}

// ----------------------------------------------------------------------

export function DashboardTable() {
  const table = useTable({ defaultOrderBy: 'orderNumber' });
  const listData = useSelector((state) => state.list.data);
  const [selected, setSelected] = useState('all');
  const [page, setPage] = useState(0);
  const [emailCount, setEmailCount] = useState({
    COMPLETED: 0,
    FAILED: 0,
    PROCESSING: 0,
    UNPROCESSED: 0,
  });
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchValue, setSearchValue] = useState('');
  const selectedTimeZone = useSelector((state) => state.timeZone.selectedTimeZone);

  const dispatch = useDispatch();
  const [tableData, setTableData] = useState(
    listData?.listData?.map((item, index) => ({
      ...item,
      id: index,
    }))
  );

  useEffect(() => {
    if (listData?.listData) {
      const counts = listData.totalEmailCounts || {};
      const totalCount = Object.values(counts).reduce((acc, count) => acc + count, 0);
      setEmailCount({
        COMPLETED: counts.COMPLETED || 0,
        FAILED: counts.FAILED || 0,
        PROCESSING: counts.PROCESSING || 0,
        UNPROCESSED: counts.UNPROCESSED || 0,
        All: totalCount || 0,
      });
      setTableData(transformData(listData?.listData, selectedTimeZone));
    }
  }, [listData, selectedTimeZone]);

  const handleStartVerification = (row) => {
    dispatch(startBulkVerification(row.jobId));
    dispatch(pollJobStatus({ jobId: row.jobId }));
    setProcessingRowId(row.id);
    setTableData((prevData) =>
      prevData.map((data) => (data.id === row.id ? { ...row, status: 'processing' } : data))
    );
  };

  const filters = useSetState({
    name: '',
    status: 'all',
  });

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters: filters.state,
  });

  // Use local pagination state instead of table state
  const dataInPage = rowInPage(dataFiltered, page, rowsPerPage);

  const canReset =
    !!filters.state.name ||
    filters.state.status !== 'all' ||
    (!!filters.state.startDate && !!filters.state.endDate);

  const notFound = (!dataFiltered?.length && canReset) || !dataFiltered?.length;

  const handleFilterStatus = useCallback(
    (event, newValue) => {
      table.onResetPage();
      setPage(0); // Reset local page state as well
      filters.setState({ status: newValue });
    },
    [filters, table]
  );

  const isStartVerification = useSelector((state) => state.fileUpload.isStartVerification);
  const isVerificationCompleted = useSelector((state) => state.fileUpload.isVerificationCompleted);
  const [processingRowId, setProcessingRowId] = useState(null);

  useEffect(() => {
    if (isVerificationCompleted && processingRowId !== null) {
      setTableData((prevData) =>
        prevData.map((row) => (row.id === processingRowId ? { ...row, status: 'completed' } : row))
      );
      setProcessingRowId(null); // Reset processing row ID
    }
  }, [isVerificationCompleted, processingRowId]);

  const confirmDelete = useBoolean();

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);

  const handleOpenPopover = (event, row) => {
    setAnchorEl(event.currentTarget);
    setSelectedRow(row);
  };

  const handleClosePopover = () => {
    setAnchorEl(null);
    setSelectedRow(null);
  };

  const [snackbarState, setSnackbarState] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarState((prev) => ({ ...prev, open: false }));
  };

  const theme = useTheme();

  const handleConfirmDelete = () => {
    confirmDelete.onTrue();
  };

  const handleDelete = async () => {
    confirmDelete.onFalse();
    const res = await dispatch(deleteList({ jobId: selectedRow.jobId })).unwrap();
    handleClosePopover();

    if (res.status === 'success') {
      setTableData((prevData) => prevData.filter((row) => row.jobId !== selectedRow.jobId));
      dispatch(fetchChartValues());
      setSnackbarState({
        open: true,
        message: 'Email list deleted successfully.',
        severity: 'success',
      });
    } else {
      setSnackbarState({
        open: true,
        message: 'Email list not deleted successfully.',
        severity: 'danger',
      });
    }
  };

  const handleOnClose = () => {
    confirmDelete.onFalse();
    handleClosePopover();
  };

  // Handle rows per page change
  const handleRowsPerPageChange = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    // Also update the table's internal state
    table.onRowsPerPageChange(event);
  };

  // Handle page change
  const handlePageChange = (event, newPage) => {
    setPage(newPage);
    // Also update the table's internal state
    table.onPageChange(event, newPage);
  };

  useEffect(() => {
    if (selected === 'processing') {
      return;
    }
    if (selected === 'all') {
      dispatch(
        fetchLists({
          status: filters.state.status,
          page: page + 1,
          limit: rowsPerPage,
          search: searchValue,
        })
      );
    } else {
      dispatch(
        fetchLists({
          type: selected,
          page: page + 1,
          limit: rowsPerPage,
          status: filters.state.status,
          search: searchValue,
        })
      );
    }
  }, [dispatch, selected, page, rowsPerPage, searchValue, filters.state.status]);

  return (
    <Card>
      <CardHeader
        title={
          <Box display="inline-block">
            <Tooltip
              title="See all your uploaded files and their verification status"
              arrow
              placement="top"
            >
              <Typography variant="h6">Uploaded List</Typography>
            </Tooltip>
          </Box>
        }
        subheader="View all the uploaded list here."
        sx={{ pb: 3 }}
      />
      <Divider />
      <Tabs
        value={filters.state.status}
        onChange={handleFilterStatus}
        sx={{
          px: 2.5,
          boxShadow: `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
        }}
      >
        {STATUS_OPTIONS.map((tab) => (
          <Tab
            key={tab.value}
            iconPosition="end"
            value={tab.value}
            label={
              <Tooltip disableInteractive placement="top" arrow title={tab.tooltip}>
                <span>{tab.label}</span>
              </Tooltip>
            }
            icon={
              <Label
                variant={
                  tab.value === 'all' || tab.value === filters.state.status ? 'filled' : 'soft'
                }
                color={
                  (tab.value === 'completed' && 'success') ||
                  (tab.value === 'processing' && 'info') ||
                  (tab.value === 'unprocessed' && 'error') ||
                  'default'
                }
              >
                {tab.value === 'completed'
                  ? Number(emailCount.COMPLETED)
                  : tab.value === 'processing'
                    ? Number(emailCount.PROCESSING)
                    : tab.value === 'unprocessed'
                      ? Number(emailCount.UNPROCESSED)
                      : tab.value === 'all'
                        ? Number(emailCount.All)
                        : 0}
              </Label>
            }
          />
        ))}
      </Tabs>

      <DashboardTableToolbar
        filters={filters}
        onResetPage={() => {
          table.onResetPage();
          setPage(0);
        }}
        setSearchValue={setSearchValue}
      />

      {canReset && (
        <DashboardTableFiltersResult
          filters={filters}
          totalResults={listData?.totalEmailLists}
          onResetPage={() => {
            table.onResetPage();
            setPage(0);
          }}
          sx={{ p: 2.5, pt: 0 }}
        />
      )}

      <Box sx={{ position: 'relative' }}>
        <Table size={table.dense ? 'small' : 'medium'}>
          <TableHeadCustom
            showCheckbox={false}
            order={table.order}
            orderBy={table.orderBy}
            headLabel={TABLE_HEAD}
            rowCount={dataFiltered?.length}
            numSelected={table.selected.length}
            onSort={table.onSort}
            onSelectAllRows={(checked) =>
              table.onSelectAllRows(
                checked,
                dataFiltered?.map((row) => row.id)
              )
            }
          />

          <TableBody>
            {dataFiltered
              ?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row, index) => (
                <DashboardTableRow
                  key={row.id}
                  row={row}
                  selected={table.selected.includes(row.id)}
                  onSelectRow={() => table.onSelectRow(row.id)}
                  onOpenPopover={(event) => handleOpenPopover(event, row)}
                  dashboardTableIndex={page * rowsPerPage + index}
                  onStartVerification={() => handleStartVerification(row)}
                  isProcessing={processingRowId === row.id && isStartVerification}
                  isCompleted={processingRowId === row.id && isVerificationCompleted}
                />
              ))}

            <TableEmptyRows
              height={table.dense ? 56 : 76}
              emptyRows={emptyRows(page, rowsPerPage, dataFiltered?.length)}
            />

            {notFound && (
              <TableNoData
                title="No Search Found"
                description={`No search found with keyword "${filters.state.name}"`}
                notFound={notFound}
              />
            )}

            {!notFound && tableData?.length === 0 && (
              <TableNoData
                title="No Data Found"
                description="No data found in the table"
                notFound={true}
              />
            )}
          </TableBody>
        </Table>
      </Box>

      <CustomPopover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClosePopover}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          <Tooltip title="Delete connection." arrow placement="left">
            <MenuItem onClick={handleConfirmDelete} sx={{ color: 'error.main' }}>
              <Iconify icon="solar:trash-bin-trash-bold" />
              Delete
            </MenuItem>
          </Tooltip>
        </MenuList>
      </CustomPopover>

      <ConfirmDialog
        open={confirmDelete.value}
        onClose={handleOnClose}
        title="Delete"
        content="Are you sure you want to delete this email list?"
        action={
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        }
      />

      <Snackbar
        open={snackbarState.open}
        autoHideDuration={2500}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{
          boxShadow: '0px 8px 16px 0px rgba(145, 158, 171, 0.16)',
          mt: 8,
          zIndex: theme.zIndex.modal + 9999,
        }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarState.severity}
          sx={{
            width: '100%',
            fontSize: '14px',
            fontWeight: 'bold',
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            '& .MuiAlert-icon': {
              color:
                snackbarState.severity === 'error'
                  ? theme.palette.error.main
                  : theme.palette.success.main,
            },
          }}
        >
          {snackbarState.message}
        </Alert>
      </Snackbar>

      <TablePaginationCustom
        page={page}
        count={listData?.totalEmailLists}
        dense={table.dense}
        rowsPerPage={rowsPerPage}
        onPageChange={handlePageChange}
        onChangeDense={table.onChangeDense}
        onRowsPerPageChange={handleRowsPerPageChange}
      />
    </Card>
  );

  function applyFilter({ inputData, comparator, filters, dateError }) {
    const { status, name, startDate, endDate } = filters;

    const stabilizedThis = inputData?.map((el, index) => [el, index]);

    stabilizedThis?.sort((a, b) => {
      const order = comparator(a[0], b[0]);
      if (order !== 0) return order;
      return a[1] - b[1];
    });

    inputData = stabilizedThis?.map((el) => el[0]);

    if (name) {
      inputData = inputData?.filter(
        (order) =>
          order.uploadedList?.name?.toLowerCase()?.indexOf(name?.toLowerCase()) !== -1 ||
          order.uploadedList?.email?.toLowerCase()?.indexOf(name?.toLowerCase()) !== -1
      );
    }

    if (status !== 'all') {
      inputData = inputData?.filter((order) => order.status === status);
    }

    if (!dateError) {
      if (startDate && endDate) {
        inputData = inputData?.filter((order) => fIsBetween(order.createdAt, startDate, endDate));
      }
    }

    return inputData;
  }
}
