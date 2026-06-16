import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  IconButton,
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
  MenuItem,
  Grid,
} from '@mui/material';
import { Add, Visibility, FilterList } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { productionScheduleService } from '../services/productionScheduleService.js';
import { productionLineService } from '../services/productionLineService.js';

export function ProductionSchedulesPage() {
  const [schedules, setSchedules] = useState([]);
  const [lines, setLines] = useState([]);
  const [lineFilter, setLineFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Loading state

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const lineRes = await productionLineService.list({ status: 'ACTIVE' });
      setLines(lineRes.data ?? []);

      const params = {
        productionLineId: lineFilter === 'all' ? undefined : Number(lineFilter),
        scheduleDate: dateFilter || undefined,
      };
      const schedRes = await productionScheduleService.listSchedules(params);
      setSchedules(schedRes.data ?? []);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Không tải được kế hoạch sản xuất ca');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [lineFilter, dateFilter]);

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Kế hoạch sản xuất ca
          </Typography>
          <Typography color="text.secondary">
            Kế hoạch phân bổ ca may, sản lượng mục tiêu và điều phối công nhân chi tiết theo ngày.
          </Typography>
        </Box>
        <Button
          variant="contained"
          component={Link}
          to="/production-schedules/new"
          startIcon={<Add />}
          sx={{ borderRadius: '8px', bgcolor: '#176b5b', '&:hover': { bgcolor: '#0f5245' } }}
        >
          Lập lịch sản xuất ca
        </Button>
      </Box>

      <Card variant="outlined" sx={{ p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              select
              fullWidth
              size="small"
              label="Lọc theo chuyền"
              value={lineFilter}
              onChange={(e) => setLineFilter(e.target.value)}
            >
              <MenuItem value="all">Tất cả chuyền may</MenuItem>
              {lines.map((l) => (
                <MenuItem key={l.id} value={l.id}>{l.lineName}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={5}>
            <TextField
              type="date"
              fullWidth
              size="small"
              label="Lọc theo ngày"
              InputLabelProps={{ shrink: true }}
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button variant="outlined" fullWidth onClick={loadData} startIcon={<FilterList />}>
              Làm mới
            </Button>
          </Grid>
        </Grid>
      </Card>

      {error && <Alert severity="error">{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : schedules.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
          Không tìm thấy kế hoạch ca nào phù hợp.
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead sx={{ bgcolor: '#f5f7f6' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Ngày</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Chuyền</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Ca</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Lệnh sản xuất</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Sản phẩm</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Mục tiêu</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Số công nhân</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {schedules.map((sched) => (
                <TableRow key={sched.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{sched.scheduleDate}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{sched.lineName}</TableCell>
                  <TableCell>{sched.shiftName} ({sched.startTime} - {sched.endTime})</TableCell>
                  <TableCell sx={{ color: '#176b5b', fontWeight: 600 }}>{sched.productionOrderCode}</TableCell>
                  <TableCell>{sched.productName}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{sched.targetQuantity} cái</TableCell>
                  <TableCell>{sched.plannedWorkers} người</TableCell>
                  <TableCell>
                    <Chip
                      label={sched.status}
                      size="small"
                      color={
                        sched.status === 'CONFIRMED'
                          ? 'primary'
                          : sched.status === 'IN_PROGRESS'
                          ? 'info'
                          : sched.status === 'COMPLETED'
                          ? 'success'
                          : 'default'
                      }
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton component={Link} to={`/production-schedules/${sched.id}`} color="info" title="Xem & phân công thợ">
                      <Visibility />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Stack>
  );
}


