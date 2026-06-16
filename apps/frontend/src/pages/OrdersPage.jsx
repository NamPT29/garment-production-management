import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { Add, Edit, Visibility } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { customerService } from '../services/customerService.js';
import { orderService } from '../services/orderService.js';
import { PriorityChip, StatusChip } from '../ui/StatusChip.jsx';
import { hasPermission } from '../utils/auth.js';

const statuses = ['', 'DRAFT', 'CONFIRMED', 'PLANNED', 'IN_PRODUCTION', 'QUALITY_CHECK', 'COMPLETED', 'DELIVERED', 'CANCELLED'];
const priorities = ['', 'LOW', 'NORMAL', 'HIGH', 'URGENT'];

export function OrdersPage() {
  const [rows, setRows] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [filters, setFilters] = useState({ search: '', status: '', priority: '', customerId: '', deliveryFrom: '', deliveryTo: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadCustomers = async () => {
    const response = await customerService.list({ limit: 100, isActive: true });
    setCustomers(response.data.items);
  };

  const loadData = async (page = pagination.page, limit = pagination.limit) => {
    setLoading(true);
    setError('');
    try {
      const response = await orderService.list({
        page,
        limit,
        ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value)),
      });
      setRows(response.data.items);
      setPagination(response.data.pagination);
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? 'Khong tai duoc don hang');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
    loadData(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Don hang
          </Typography>
          <Typography color="text.secondary">Quan ly don hang san xuat va trang thai thuc hien.</Typography>
        </Box>
        {hasPermission('ORDER_CREATE') ? (
          <Button component={Link} to="/orders/new" startIcon={<Add />} variant="contained">
            Tao don hang
          </Button>
        ) : null}
      </Stack>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2}>
          <TextField label="Tim kiem" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
          <FormControl sx={{ minWidth: 170 }}>
            <InputLabel>Trang thai</InputLabel>
            <Select label="Trang thai" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              {statuses.map((status) => <MenuItem key={status || 'all'} value={status}>{status || 'Tat ca'}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Uu tien</InputLabel>
            <Select label="Uu tien" value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
              {priorities.map((priority) => <MenuItem key={priority || 'all'} value={priority}>{priority || 'Tat ca'}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 220 }}>
            <InputLabel>Khach hang</InputLabel>
            <Select label="Khach hang" value={filters.customerId} onChange={(e) => setFilters({ ...filters, customerId: e.target.value })}>
              <MenuItem value="">Tat ca</MenuItem>
              {customers.map((customer) => <MenuItem key={customer.id} value={customer.id}>{customer.customerName}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Giao tu" type="date" value={filters.deliveryFrom} onChange={(e) => setFilters({ ...filters, deliveryFrom: e.target.value })} InputLabelProps={{ shrink: true }} />
          <TextField label="Giao den" type="date" value={filters.deliveryTo} onChange={(e) => setFilters({ ...filters, deliveryTo: e.target.value })} InputLabelProps={{ shrink: true }} />
          <Button variant="outlined" onClick={() => loadData(1)}>Loc</Button>
        </Stack>
      </Paper>

      {error ? <Paper sx={{ p: 2, color: 'error.main' }}>{error}</Paper> : null}

      <Paper variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Ma don</TableCell>
              <TableCell>Khach hang</TableCell>
              <TableCell>Ngay dat</TableCell>
              <TableCell>Ngay giao</TableCell>
              <TableCell>Uu tien</TableCell>
              <TableCell>Trang thai</TableCell>
              <TableCell>Tong SL</TableCell>
              <TableCell align="right">Thao tac</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.orderCode}</TableCell>
                <TableCell>{row.customer.customerName}</TableCell>
                <TableCell>{String(row.orderDate).slice(0, 10)}</TableCell>
                <TableCell>{String(row.expectedDeliveryDate).slice(0, 10)}</TableCell>
                <TableCell><PriorityChip value={row.priority} /></TableCell>
                <TableCell><StatusChip value={row.status} /></TableCell>
                <TableCell>{row.totalQuantity}</TableCell>
                <TableCell align="right">
                  <Button component={Link} to={`/orders/${row.id}`} size="small" startIcon={<Visibility />}>Xem</Button>
                  {hasPermission('ORDER_UPDATE') && !['DELIVERED', 'CANCELLED'].includes(row.status) ? (
                    <Button component={Link} to={`/orders/${row.id}/edit`} size="small" startIcon={<Edit />}>Sua</Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
            {!loading && rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">Chua co don hang</TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={pagination.total}
          page={pagination.page - 1}
          rowsPerPage={pagination.limit}
          onPageChange={(_event, page) => loadData(page + 1, pagination.limit)}
          onRowsPerPageChange={(event) => loadData(1, Number(event.target.value))}
        />
      </Paper>
    </Stack>
  );
}
