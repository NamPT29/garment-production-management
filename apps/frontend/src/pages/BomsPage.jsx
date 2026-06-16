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
import { Add, Visibility, Edit, FilterList } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { bomService } from '../services/bomService.js';
import { productService } from '../services/productService.js';

export function BomsPage() {
  const [boms, setBoms] = useState([]);
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Filters
  const [search, setSearch] = useState('');
  const [productFilter, setProductFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadBoms = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit,
        search: search.trim() || undefined,
        productId: productFilter === 'all' ? undefined : Number(productFilter),
        status: statusFilter === 'all' ? undefined : statusFilter,
        sortBy: 'created_at',
        sortOrder: 'DESC',
      };
      const response = await bomService.list(params);
      setBoms(response.data.items);
      setTotal(response.data.pagination.total);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Không tải được danh sách định mức (BOM)');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await productService.list({ page: 1, limit: 100, isActive: 'true' });
      setProducts(response.data.items);
    } catch (err) {
      console.error('Không tải được danh sách sản phẩm', err);
    }
  };

  useEffect(() => {
    loadBoms();
  }, [page, productFilter, statusFilter]);

  useEffect(() => {
    loadProducts();
  }, []);

  const handleSearchClick = () => {
    setPage(1);
    loadBoms();
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearchClick();
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'DRAFT':
        return 'warning';
      case 'INACTIVE':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'Đang hoạt động';
      case 'DRAFT':
        return 'Nháp';
      case 'INACTIVE':
        return 'Ngừng hoạt động';
      default:
        return status;
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Quản lý định mức vật tư (BOM)
          </Typography>
          <Typography color="text.secondary">
            Thiết lập định mức kỹ thuật nguyên phụ liệu cho từng sản phẩm may mặc.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} component={Link} to="/boms/new" sx={{ borderRadius: '8px' }}>
          Tạo BOM mới
        </Button>
      </Box>

      <Card variant="outlined" sx={{ p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              size="small"
              placeholder="Tìm theo sản phẩm, phiên bản..."
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
              label="Sản phẩm"
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
            >
              <MenuItem value="all">Tất cả sản phẩm</MenuItem>
              {products.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.productName} ({p.productCode})
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Trạng thái"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">Tất cả trạng thái</MenuItem>
              <MenuItem value="DRAFT">Nháp (DRAFT)</MenuItem>
              <MenuItem value="ACTIVE">Hoạt động (ACTIVE)</MenuItem>
              <MenuItem value="INACTIVE">Không hoạt động (INACTIVE)</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={2}>
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
      ) : boms.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
          Không tìm thấy bảng định mức (BOM) nào.
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead sx={{ bgcolor: '#f5f7f6' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Mã sản phẩm</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tên sản phẩm</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Phiên bản</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Ngày hiệu lực</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Ghi chú</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {boms.map((bom) => (
                <TableRow key={bom.id} hover>
                  <TableCell sx={{ fontWeight: 600, color: '#176b5b' }}>{bom.product.productCode}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{bom.product.productName}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{bom.version}</TableCell>
                  <TableCell>{bom.effectiveDate}</TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(bom.status)}
                      color={getStatusColor(bom.status)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {bom.notes || '-'}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton color="info" component={Link} to={`/boms/${bom.id}`} title="Xem chi tiết">
                      <Visibility />
                    </IconButton>
                    {bom.status === 'DRAFT' ? (
                      <IconButton color="primary" component={Link} to={`/boms/${bom.id}/edit`} title="Sửa">
                        <Edit />
                      </IconButton>
                    ) : null}
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
