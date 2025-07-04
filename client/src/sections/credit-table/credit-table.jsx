import { useSelector, useDispatch } from 'react-redux';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import { Divider, Tooltip, CardHeader, Typography } from '@mui/material';

import { useSetState } from 'src/hooks/use-set-state';

import { fIsBetween } from 'src/utils/format-time-util';
import { convertToTimezone } from 'src/utils/date-utils';

import { fetchCreditsHistory } from 'src/redux/slice/creditSlice';

import { Scrollbar } from 'src/components/scrollbar';
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

import { CreditTableRow } from './credit-table-row';
import { CreditTableToolbar } from './credit-table-toolbar';
import { CreditTableFiltersResult } from './credit-table-filters-result';

function applyFilter({ inputData, filters, dateError }) {
  const { status, name, startDate, endDate } = filters;

  let filteredData = inputData;

  // Filter by message (name)
  if (name) {
    filteredData = filteredData.filter(
      (order) => order.message && order.message.toLowerCase().includes(name.toLowerCase())
    );
  }

  // Filter by status
  if (status !== 'all') {
    filteredData = filteredData.filter((order) => order.credits === status);
  }

  // Filter by date range
  if (!dateError) {
    if (startDate && endDate) {
      filteredData = filteredData.filter((order) =>
        fIsBetween(new Date(order.dateCreatedOn), startDate, endDate)
      );
    }
  }

  return filteredData;
}

const TABLE_HEAD = [
  {
    id: 'statusdate',
    label: 'Status/Date',
    width: 'flex',
    whiteSpace: 'nowrap',
    tooltip: 'Date and time when the email verification action occurred.',
  },

  {
    id: 'message',
    label: 'Message',
    width: 'flex',
    whiteSpace: 'nowrap',
    tooltip: 'Description of the email verification action or status update.',
  },
  {
    id: 'credits',
    label: 'Credits',
    width: 'flex',
    whiteSpace: 'nowrap',
    align: 'right',
    tooltip: 'Current state of the email verification credits.',
  },
];
function transformData(data, selectedTimeZone) {
  return data.map((item) => {
    const dateCreatedOn = convertToTimezone(item.createdAt, selectedTimeZone);

    let message = item.description;
    if (item.type === 'ADDITION') {
      message = item.description.includes('Credits added by admin')
        ? 'Email credits added by Admin'
        : item.description;
    } else if (item.type === 'DEDUCTION') {
      if (item.description.includes('Verifying Email')) {
        message = item.description.replace('Used In Verifying Email:', 'Used in verifying email:');
      } else if (item.description.includes('Verifying "SampleImport1.csv" List')) {
        message = item.description.replace(
          'Used In Verifying "SampleImport1.csv" List',
          'Used in verifying "SampleImport_(3).csv" list'
        );
      }
    }

    return {
      dateCreatedOn,
      message,
      status: item.status
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      credits: item.type === 'ADDITION' ? 'Alloted' : 'Consumed',
      noOfCredits: item.amount,
    };
  });
}

export function CreditTable() {
  const dispatch = useDispatch();
  const { history } = useSelector((store) => store.credits);
  const table = useTable({ defaultOrderBy: 'orderNumber' });
  const [currentFilter, setCurrentFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchValue, setSearchValue] = useState('');
  const selectedTimeZone = useSelector((state) => state.timeZone.selectedTimeZone);

  const [tableData, setTableData] = useState([]);

  useEffect(() => {
    if (history.data && history.data.length > 0) {
      setTableData(transformData(history.data, selectedTimeZone));
    } else {
      setTableData([]);
    }
  }, [history, selectedTimeZone]);

  const filters = useSetState({
    name: '',
    status: 'all',
  });

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters: filters.state,
  });

  const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);
  const canReset =
    !!filters.state.name ||
    filters.state.status !== 'all' ||
    (!!filters.state.startDate && !!filters.state.endDate);

  const notFound = !history.data?.length || (!dataFiltered.length && canReset);

  const handleFilterStatus = useCallback(
    (event, newValue) => {
      table.onResetPage();
      filters.setState({ status: newValue });
    },
    [filters, table]
  );
  const setTotalRowsPerPage = (num) => {
    setRowsPerPage(num);
    setPage(0);
  };

  useEffect(() => {
    dispatch(
      fetchCreditsHistory({
        page: page + 1,
        limit: rowsPerPage,
        search: searchValue,
        status: currentFilter,
      })
    );
  }, [dispatch, page, rowsPerPage, currentFilter, searchValue]);

  const handleSearch = (value) => {
    // Clear any existing timeout
  };
  const handleFilterApplied = (filter) => {
    switch (filter) {
      case 'Added':
        setCurrentFilter('added');
        break;
      case 'Verified Email':
        setCurrentFilter('email');
        break;
      case 'Verified List':
        setCurrentFilter('list');
        break;
      default:
        setCurrentFilter('all');
        break;
    }
    setPage(0);
  };

  return (
    <Card>
      <CardHeader
        title={
          <Box display="inline-block">
            <Tooltip
              arrow
              placement="top"
              disableInteractive
              title="View all the email verification logs here."
            >
              <Typography variant="h6">Email Verification Logs</Typography>
            </Tooltip>
          </Box>
        }
        sx={{ pb: 3 }}
        subheader="All the email verification logs will appear here."
      />
      <Divider />

      <CreditTableToolbar
        filters={filters}
        setCurrentFilter={setCurrentFilter}
        onResetPage={table.onResetPage}
        setSearchValue={setSearchValue}
        searchValue={searchValue}
        onFilterChange={handleFilterApplied}
        totalCredits={history.totalCredits ? history.totalCredits : 0}
      />
      {canReset && (
        <CreditTableFiltersResult
          filters={filters}
          totalResults={dataFiltered.length}
          onResetPage={table.onResetPage}
          sx={{ p: 2.5, pt: 0 }}
        />
      )}

      <Box sx={{ position: 'relative' }}>
        <Scrollbar>
          <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
            <TableHeadCustom
              showCheckbox={false}
              order={table.order}
              orderBy={table.orderBy}
              headLabel={TABLE_HEAD}
              numSelected={table.selected.length}
              onSort={table.onSort}
              onSelectAllRows={(checked) =>
                table.onSelectAllRows(
                  checked,
                  dataFiltered.map((row) => row.id)
                )
              }
            />
            <TableBody>
              {dataFiltered.length > 0 ? (
                <>
                  {dataInPage.map((row, index) => (
                    <CreditTableRow
                      key={index}
                      row={row}
                      selected={table.selected.includes(row.id)}
                    />
                  ))}
                  <TableEmptyRows
                    height={table.dense ? 56 : 76}
                    emptyRows={emptyRows(table.page, table.rowsPerPage, dataFiltered.length)}
                  />
                </>
              ) : (
                <TableNoData
                  title={searchValue ? 'No Search Results' : 'No Data Available'}
                  description={
                    searchValue
                      ? `No results found for "${searchValue}"`
                      : 'No data available in the table'
                  }
                  notFound={notFound}
                />
              )}
            </TableBody>
          </Table>
        </Scrollbar>
      </Box>

      <TablePaginationCustom
        page={page}
        count={history?.totalCredits ? history?.totalCredits : 0}
        rowsPerPage={rowsPerPage}
        onPageChange={(e, newPage) => setPage(newPage)}
        onChangeDense={table.onChangeDense}
        onRowsPerPageChange={(e) => setTotalRowsPerPage(parseInt(e.target.value, 10))}
      />
    </Card>
  );
}
