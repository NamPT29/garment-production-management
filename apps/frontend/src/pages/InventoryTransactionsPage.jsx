import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  MenuItem,
  Pagination,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { ArrowBack, Visibility, FilterList } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { inventoryService } from '../services/inventoryService.js';
import { warehouseService } from '../services/warehouseService.js';

export function InventoryTransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadTransactions = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit,
        search: search.trim() || undefined,
        transactionType: typeFilter === 'all' ? undefined : typeFilter,
        warehouseId: warehouseFilter === 'all' ? undefined : Number(warehouseFilter),
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        sortBy: 'created_at',
        sortOrder: 'DESC',
      };
      const response = await inventoryService.listTransactions(params);
      setTransactions(response.data.items);
      setTotal(response.data.pagination.total);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Không tải được lịch sử giao dịch kho');
    } finally {
      setLoading(false);
    }
  };

  const loadWarehouses = async () => {
    try {
      const response = await warehouseService.list({ page: 1, limit: 100, isActive: 'true' });
      setWarehouses(response.data.items);
    } catch (err) {
      console.error('Không tải được danh sách kho', err);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [page, typeFilter, warehouseFilter]);

  useEffect(() => {
    loadWarehouses();
  }, []);

  const handleSearchClick = () => {
    setPage(1);
    loadTransactions();
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearchClick();
    }
  };

  const getTxTypeLabel = (type) => {
    switch (type) {
      case 'RECEIPT':
        return 'Nhập kho';
      case 'ISSUE':
        return 'Xuất kho';
      case 'ADJUSTMENT_IN':
        return 'Điều chỉnh tăng';
      case 'ADJUSTMENT_OUT':
        return 'Điều chỉnh giảm';
      default:
        return type;
    }
  };

  const getTxTypeColor = (type) => {
    switch (type) {
      case 'RECEIPT':
        return 'success';
      case 'ISSUE':
        return 'error';
      case 'ADJUSTMENT_IN':
        return 'warning';
      case 'ADJUSTMENT_OUT':
        return 'info';
      default:
        return 'default';
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <Stack spacing={3}>
      <Box>
        <Button startIcon={<ArrowBack />} component={Link} to="/inventory" sx={{ mb: 2 }}>
          Quay lại tồn kho
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Lịch sử giao dịch kho
        </Typography>
        <Typography color="text.secondary">
          Danh sách phiếu nhập, xuất, và điều chỉnh tồn kho nguyên phụ liệu đã thực hiện.
        </Typography>
      </Box>

      <Card variant="outlined" sx={{ p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Tìm theo mã phiếu, ghi chú..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={handleSearchKeyPress}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Loại giao dịch"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <MenuItem value="all">Tất cả loại</MenuItem>
              <MenuItem value="RECEIPT">Nhập kho (RECEIPT)</MenuItem>
              <MenuItem value="ISSUE">Xuất kho (ISSUE)</MenuItem>
              <MenuItem value="ADJUSTMENT_IN">Điều chỉnh tăng (ADJ_IN)</MenuItem>
              <MenuItem value="ADJUSTMENT_OUT">Điều chỉnh giảm (ADJ_OUT)</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Kho hàng"
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
            >
              <MenuItem value="all">Tất cả kho</MenuItem>
              {warehouses.map((wh) => (
                <MenuItem key={wh.id} value={wh.id}>
                  {wh.warehouseName}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              type="date"
              size="small"
              label="Từ ngày"
              fullWidth
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              type="date"
              size="small"
              label="Đến ngày"
              fullWidth
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={1}>
            <Button variant="outlined" fullWidth onClick={handleSearchClick} startIcon={<FilterList />}>
              Lọc
            </Button>
          </Grid>
        </Grid>
      </Card>

      {error ? <Alert severity="error">{error}</Alert> : null}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress color="primary" />
        </Box>
      ) : transactions.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
          Không có giao dịch nào được ghi nhận.
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead sx={{ bgcolor: '#f5f7f6' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Mã phiếu</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Loại giao dịch</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Kho hàng</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Ngày giao dịch</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Số chứng từ (Ref)</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Đối tác / Đơn hàng</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Người lập phiếu</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id} hover>
                  <TableCell sx={{ fontWeight: 600, color: '#176b5b' }}>{tx.transactionCode}</TableCell>
                  <TableCell>
                    <Chip
                      label={getTxTypeLabel(tx.transactionType)}
                      color={getTxTypeColor(tx.transactionType)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{tx.warehouse.warehouseName}</TableCell>
                  <TableCell>{tx.transactionDate}</TableCell>
                  <TableCell>{tx.referenceNumber || '-'}</TableCell>
                  <TableCell>
                    {tx.supplier ? `NCC: ${tx.supplier.supplierName}` : ''}
                    {tx.order ? `ĐH: ${tx.order.orderCode}` : ''}
                    {!tx.supplier && !tx.order ? '-' : ''}
                  </TableCell>
                  <TableCell>{tx.createdByUser?.fullName || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={tx.status === 'POSTED' ? 'Ghi sổ' : 'Bản nháp'}
                      color={tx.status === 'POSTED' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton color="info" component={Link} to={`/inventory/transactions/${tx.id}`} title="Chi tiết">
                      <Visibility />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
            <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
          </Box>
        </TableContainer>
      )}
    </Stack>
  );
}
