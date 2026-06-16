import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  LinearProgress,
  Pagination,
} from '@mui/material';
import { Add, Edit, Visibility, Search } from '@mui/icons-material';
import { productionOrderService } from '../services/productionOrderService.js';

const poStatuses = [
  { value: 'DRAFT', label: 'Bản thảo (DRAFT)', color: 'default' },
  { value: 'PLANNED', label: 'Đã lên kế hoạch (PLANNED)', color: 'info' },
  { value: 'RELEASED', label: 'Đã giải phóng (RELEASED)', color: 'secondary' },
  { value: 'IN_PROGRESS', label: 'Đang sản xuất (IN_PROGRESS)', color: 'primary' },
  { value: 'PAUSED', label: 'Tạm dừng (PAUSED)', color: 'warning' },
  { value: 'COMPLETED', label: 'Đã hoàn thành (COMPLETED)', color: 'success' },
  { value: 'CANCELLED', label: 'Đã hủy (CANCELLED)', color: 'error' },
];

const priorities = [
  { value: 'LOW', label: 'Thấp', color: 'default' },
  { value: 'NORMAL', label: 'Thường', color: 'primary' },
  { value: 'HIGH', label: 'Cao', color: 'warning' },
  { value: 'URGENT', label: 'Khẩn cấp', color: 'error' },
];

export function ProductionOrdersPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit,
        search: search.trim() || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        priority: priorityFilter === 'all' ? undefined : priorityFilter,
      };
      const response = await productionOrderService.list(params);
      setItems(response.data.items || []);
      setTotal(response.data.total || 0);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Không tải được danh sách lệnh sản xuất');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [page, statusFilter, priorityFilter]);

  const handleSearch = () => {
    setPage(1);
    loadOrders();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Lệnh sản xuất (Production Orders)
          </Typography>
          <Typography color="text.secondary">
            Theo dõi tiến độ sản xuất, sản lượng hoàn thành, tỷ lệ lỗi và trạng thái thực hiện các lệnh sản xuất.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/production-orders/new')}>
          Tạo lệnh sản xuất
        </Button>
      </Box>

      {/* Filters */}
      <Card variant="outlined" sx={{ p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              label="Tìm mã lệnh, đơn hàng, sản phẩm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={handleKeyPress}
              InputProps={{
                endAdornment: (
                  <IconButton onClick={handleSearch} edge="end">
                    <Search />
                  </IconButton>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Trạng thái lệnh"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">Tất cả trạng thái</MenuItem>
              {poStatuses.map((st) => (
                <MenuItem key={st.value} value={st.value}>
                  {st.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Độ ưu tiên"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <MenuItem value="all">Tất cả độ ưu tiên</MenuItem>
              {priorities.map((pr) => (
                <MenuItem key={pr.value} value={pr.value}>
                  {pr.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Card>

      {error && <Alert severity="error">{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Mã lệnh SX</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Đơn đặt hàng</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Sản phẩm</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Độ ưu tiên</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center" style={{ width: '180px' }}>
                  Tiến độ sản lượng
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Kế hoạch</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    Không tìm thấy lệnh sản xuất nào
                  </TableCell>
                </TableRow>
              ) : (
                items.map((po) => {
                  const statusInfo = poStatuses.find((s) => s.value === po.status) || {
                    label: po.status,
                    color: 'default',
                  };
                  const prioInfo = priorities.find((p) => p.value === po.priority) || {
                    label: po.priority,
                    color: 'default',
                  };
                  const progress = po.plannedQuantity > 0 ? (po.completedQuantity / po.plannedQuantity) * 100 : 0;
                  return (
                    <TableRow key={po.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{po.productionOrderCode}</TableCell>
                      <TableCell sx={{ fontWeight: 500, color: 'text.secondary' }}>{po.orderCode}</TableCell>
                      <TableCell>{po.productName}</TableCell>
                      <TableCell>
                        <Chip label={prioInfo.label} color={prioInfo.color} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                      </TableCell>
                      <TableCell align="center">
                        <Stack spacing={0.5}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                              {po.completedQuantity} / {po.plannedQuantity}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {Math.round(progress)}%
                            </Typography>
                          </Box>
                          <LinearProgress variant="determinate" value={Math.min(progress, 100)} color={progress >= 100 ? 'success' : 'primary'} sx={{ height: 6, borderRadius: 3 }} />
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" display="block">
                          Bắt đầu: {po.plannedStartDate}
                        </Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                          Kết thúc: {po.plannedEndDate}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={statusInfo.label.split(' ')[0]} color={statusInfo.color} size="small" sx={{ fontWeight: 600 }} />
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <IconButton color="info" onClick={() => navigate(`/production-orders/${po.id}`)} size="small" title="Chi tiết">
                            <Visibility fontSize="small" />
                          </IconButton>
                          {po.status !== 'COMPLETED' && po.status !== 'CANCELLED' && (
                            <IconButton color="primary" onClick={() => navigate(`/production-orders/${po.id}/edit`)} size="small" title="Sửa">
                              <Edit fontSize="small" />
                            </IconButton>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination
            count={Math.ceil(total / limit)}
            page={page}
            onChange={(e, val) => setPage(val)}
            color="primary"
          />
        </Box>
      </>
      )}
    </Stack>
  );
}
