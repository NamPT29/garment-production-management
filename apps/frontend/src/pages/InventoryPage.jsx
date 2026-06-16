import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  FormControlLabel,
  Grid,
  MenuItem,
  Pagination,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  InputAdornment,
} from '@mui/material';
import { Search, Add, Remove, Settings, History, Warning } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { inventoryService } from '../services/inventoryService.js';
import { warehouseService } from '../services/warehouseService.js';

const categories = [
  { value: 'FABRIC', label: 'Vải (FABRIC)' },
  { value: 'THREAD', label: 'Chỉ may (THREAD)' },
  { value: 'BUTTON', label: 'Cúc/Nút (BUTTON)' },
  { value: 'ZIPPER', label: 'Khóa kéo (ZIPPER)' },
  { value: 'LABEL', label: 'Nhãn mác (LABEL)' },
  { value: 'PACKAGING', label: 'Bao bì (PACKAGING)' },
  { value: 'ACCESSORY', label: 'Phụ kiện khác (ACCESSORY)' },
  { value: 'OTHER', label: 'Khác (OTHER)' },
];

export function InventoryPage() {
  const [balances, setBalances] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);

  // Filters
  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [lowStockFilter, setLowStockFilter] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadBalances = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit,
        search: search.trim() || undefined,
        warehouseId: warehouseFilter === 'all' ? undefined : Number(warehouseFilter),
        category: categoryFilter === 'all' ? undefined : categoryFilter,
        lowStock: lowStockFilter ? 'true' : undefined,
      };
      const response = await inventoryService.listBalances(params);
      setBalances(response.data.items);
      setTotal(response.data.pagination.total);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Không tải được danh sách tồn kho');
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
    loadBalances();
  }, [page, warehouseFilter, categoryFilter, lowStockFilter]);

  useEffect(() => {
    loadWarehouses();
  }, []);

  const handleSearchClick = () => {
    setPage(1);
    loadBalances();
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearchClick();
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Số dư tồn kho hiện tại
          </Typography>
          <Typography color="text.secondary">
            Báo cáo đối chiếu và theo dõi hàng tồn kho nguyên phụ liệu theo từng kho.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            component={Link}
            to="/inventory/receipts/new"
            sx={{ borderRadius: '8px' }}
          >
            Nhập kho
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<Remove />}
            component={Link}
            to="/inventory/issues/new"
            sx={{ borderRadius: '8px' }}
          >
            Xuất kho
          </Button>
          <Button
            variant="outlined"
            color="warning"
            startIcon={<Settings />}
            component={Link}
            to="/inventory/adjustments/new"
            sx={{ borderRadius: '8px' }}
          >
            Điều chỉnh kho
          </Button>
          <Button
            variant="outlined"
            color="info"
            startIcon={<History />}
            component={Link}
            to="/inventory/transactions"
            sx={{ borderRadius: '8px' }}
          >
            Lịch sử giao dịch
          </Button>
        </Stack>
      </Box>

      <Card variant="outlined" sx={{ p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Tìm theo kho, mã, tên nguyên phụ liệu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Kho lưu trữ"
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
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Loại nguyên phụ liệu"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <MenuItem value="all">Tất cả loại</MenuItem>
              {categories.map((c) => (
                <MenuItem key={c.value} value={c.value}>
                  {c.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={lowStockFilter}
                  onChange={(e) => setLowStockFilter(e.target.checked)}
                  color="warning"
                />
              }
              label="Cảnh báo thiếu hàng"
            />
          </Grid>
          <Grid item xs={6} md={1}>
            <Button variant="outlined" fullWidth onClick={handleSearchClick}>
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
      ) : balances.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
          Không có số liệu tồn kho nào được tìm thấy.
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead sx={{ bgcolor: '#f5f7f6' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Kho lưu trữ</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Mã nguyên phụ liệu</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tên nguyên phụ liệu</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Loại</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>ĐVT</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Số lượng tồn thực tế</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Mức tồn tối thiểu</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Trạng thái cảnh báo</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {balances.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{row.warehouse.warehouseName}</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#176b5b' }}>{row.material.materialCode}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{row.material.materialName}</TableCell>
                  <TableCell>
                    <Chip label={row.material.category} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{row.material.unit}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: row.lowStock ? '#d32f2f' : 'inherit' }}>
                    {row.quantityOnHand.toLocaleString()}
                  </TableCell>
                  <TableCell align="right">{row.material.minimumStock.toLocaleString()}</TableCell>
                  <TableCell>
                    {row.lowStock ? (
                      <Chip
                        icon={<Warning style={{ fontSize: 16 }} />}
                        label="Dưới mức tối thiểu"
                        color="error"
                        size="small"
                      />
                    ) : (
                      <Chip label="Đủ hàng" color="success" size="small" variant="outlined" />
                    )}
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
