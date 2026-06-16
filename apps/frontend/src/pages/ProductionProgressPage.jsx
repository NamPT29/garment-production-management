import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { Link } from 'react-router-dom';
import { productionProgressService } from '../services/productionProgressService.js';

export function ProductionProgressPage() {
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSnapshots = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await productionProgressService.getLatestProgressSnapshots();
      setSnapshots(response.data);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Không tải được báo cáo theo dõi tiến độ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSnapshots();
  }, []);

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Theo dõi tiến độ sản xuất
        </Typography>
        <Typography color="text.secondary">
          So sánh sản lượng thực tế đã hoàn thành so với tiến trình thời gian mong đợi để cảnh báo chậm tiến độ.
        </Typography>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
      ) : snapshots.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
          Hiện không có dữ liệu tiến độ sản xuất của lệnh hoạt động nào.
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead sx={{ bgcolor: '#f5f7f6' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Mã lệnh sản xuất</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Sản phẩm</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Mục tiêu</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Lũy kế đạt</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tiến độ thực tế</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Kỳ vọng thời gian</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Chênh lệch chậm trễ</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Đánh giá</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {snapshots.map((s) => {
                const isDelayed = s.status === 'DELAYED';
                const isAtRisk = s.status === 'AT_RISK';
                return (
                  <TableRow key={s.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>
                      <Link to={`/production-orders/${s.productionOrderId}`} style={{ textDecoration: 'none', color: '#176b5b' }}>
                        {s.productionOrderCode}
                      </Link>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{s.productName}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{s.plannedQuantity} cái</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'success.main' }}>{s.completedQuantity} cái</TableCell>
                    <TableCell sx={{ minWidth: 150 }}>
                      <Stack spacing={0.5}>
                        <LinearProgress variant="determinate" value={s.progressPercent} color={isDelayed ? 'error' : isAtRisk ? 'warning' : 'success'} />
                        <Typography variant="body2" color="text.secondary">{s.progressPercent}%</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{s.expectedProgressPercent}%</TableCell>
                    <TableCell sx={{ color: s.delayQuantity > 0 ? 'error.main' : 'inherit', fontWeight: s.delayQuantity > 0 ? 600 : 400 }}>
                      {s.delayQuantity > 0 ? `${s.delayQuantity} cái` : 'Đạt tiến độ'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={s.status}
                        size="small"
                        color={s.status === 'ON_TRACK' ? 'success' : s.status === 'AT_RISK' ? 'warning' : s.status === 'DELAYED' ? 'error' : 'default'}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Stack>
  );
}
