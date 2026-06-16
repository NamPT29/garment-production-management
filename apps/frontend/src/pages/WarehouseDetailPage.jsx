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
} from '@mui/material';
import { ArrowBack, Warning } from '@mui/icons-material';
import { Link, useParams } from 'react-router-dom';
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

export function WarehouseDetailPage() {
  const { id } = useParams();
  const [warehouse, setWarehouse] = useState(null);
  const [balances, setBalances] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  
  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [lowStockFilter, setLowStockFilter] = useState(false);

  const [loadingWh, setLoadingWh] = useState(true);
  const [loadingBalances, setLoadingBalances] = useState(true);
  const [error, setError] = useState('');

  const loadWarehouse = async () => {
    setLoadingWh(true);
    try {
      const response = await warehouseService.getById(id);
      setWarehouse(response.data);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Không tải được thông tin kho');
    } finally {
      setLoadingWh(false);
    }
  };

  const loadBalances = async () => {
    setLoadingBalances(true);
    try {
      const params = {
        page,
        limit,
        search: search.trim() || undefined,
        category: categoryFilter === 'all' ? undefined : categoryFilter,
        lowStock: lowStockFilter ? 'true' : undefined,
      };
      const response = await warehouseService.getBalances(id, params);
      setBalances(response.data.items);
      setTotal(response.data.pagination.total);
    } catch (err) {
      console.error('Không tải được danh sách số dư tồn kho', err);
    } finally {
      setLoadingBalances(false);
    }
  };

  useEffect(() => {
    loadWarehouse();
  }, [id]);

  useEffect(() => {
    loadBalances();
  }, [id, page, categoryFilter, lowStockFilter]);

  const handleSearchClick = () => {
    setPage(1);
    loadBalances();
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearchClick();
    }
  };

  if (loadingWh) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (error || !warehouse) {
    return (
      <Stack spacing={2}>
        <Button startIcon={<ArrowBack />} component={Link} to="/warehouses" sx={{ alignSelf: 'flex-start' }}>
          Quay lại danh sách kho
        </Button>
        <Alert severity="error">{error || 'Không tìm thấy kho hàng'}</Alert>
      </Stack>
    );
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <Stack spacing={3}>
      <Box>
        <Button startIcon={<ArrowBack />} component={Link} to="/warehouses" sx={{ mb: 2 }}>
          Quay lại danh sách kho
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Chi tiết kho: {warehouse.warehouseName}
        </Typography>
        <Typography color="text.secondary">
          Mã kho: {warehouse.warehouseCode} | Vị trí: {warehouse.location || '-'}
        </Typography>
      </Box>

      {warehouse.description ? (
        <Card variant="outlined" sx={{ p: 2, bgcolor: '#ffffff' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Mô tả kho:
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {warehouse.description}
          </Typography>
        </Card>
      ) : null}

      <Typography variant="h5" sx={{ fontWeight: 700, mt: 2 }}>
        Bảng đối chiếu tồn kho nguyên phụ liệu
      </Typography>

      <Card variant="outlined" sx={{ p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              placeholder="Tìm theo mã hoặc tên nguyên phụ liệu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={handleSearchKeyPress}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Loại vật tư"
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
              label="Thiếu hàng"
            />
          </Grid>
          <Grid item xs={6} md={1}>
            <Button variant="outlined" fullWidth onClick={handleSearchClick}>
              Lọc
            </Button>
          </Grid>
        </Grid>
      </Card>

      {loadingBalances ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress color="primary" />
        </Box>
      ) : balances.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
          Không có nguyên phụ liệu nào trong kho này.
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead sx={{ bgcolor: '#f5f7f6' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Mã vật tư</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tên nguyên phụ liệu</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Loại</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>ĐVT</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Tồn thực tế</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Tối thiểu yêu cầu</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {balances.map((row) => (
                <TableRow key={row.id} hover>
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
                        label="Thiếu hàng"
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
