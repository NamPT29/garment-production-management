import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Grid,
} from '@mui/material';
import { ArrowBack, Edit, PlayArrow } from '@mui/icons-material';
import { Link, useParams } from 'react-router-dom';
import { bomService } from '../services/bomService.js';

export function BomDetailPage() {
  const { id } = useParams();
  const [bom, setBom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activating, setActivating] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const loadBom = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await bomService.getById(id);
      setBom(response.data);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Không tải được thông tin bảng định mức (BOM)');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBom();
  }, [id]);

  const handleActivate = async () => {
    if (window.confirm('Kích hoạt BOM này sẽ đặt nó làm định mức ACTIVE duy nhất của sản phẩm. Tất cả các phiên bản hoạt động cũ sẽ tự động bị huỷ kích hoạt. Bạn có chắc chắn muốn tiếp tục?')) {
      setActivating(true);
      try {
        await bomService.activate(id);
        showSnackbar('Kích hoạt bảng định mức thành công', 'success');
        loadBom();
      } catch (err) {
        showSnackbar(err.response?.data?.message ?? 'Kích hoạt thất bại', 'error');
      } finally {
        setActivating(false);
      }
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (error || !bom) {
    return (
      <Stack spacing={2}>
        <Button startIcon={<ArrowBack />} component={Link} to="/boms" sx={{ alignSelf: 'flex-start' }}>
          Quay lại danh sách BOM
        </Button>
        <Alert severity="error">{error || 'Không tìm thấy thông tin BOM'}</Alert>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Button startIcon={<ArrowBack />} component={Link} to="/boms" sx={{ mb: 2 }}>
            Quay lại danh sách BOM
          </Button>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Chi tiết định mức kỹ thuật (BOM)
          </Typography>
          <Typography color="text.secondary">
            Mã định mức: #{bom.id} | Ngày tạo: {new Date(bom.createdAt).toLocaleDateString()}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          {bom.status === 'DRAFT' ? (
            <Button
              variant="outlined"
              startIcon={<Edit />}
              component={Link}
              to={`/boms/${bom.id}/edit`}
              sx={{ borderRadius: '8px' }}
            >
              Sửa định mức
            </Button>
          ) : null}
          {bom.status !== 'ACTIVE' ? (
            <Button
              variant="contained"
              color="success"
              startIcon={<PlayArrow />}
              onClick={handleActivate}
              disabled={activating}
              sx={{ borderRadius: '8px' }}
            >
              {activating ? 'Đang kích hoạt...' : 'Kích hoạt định mức'}
            </Button>
          ) : null}
        </Stack>
      </Box>

      <Card variant="outlined" sx={{ p: 3, bgcolor: '#ffffff' }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">
              Sản phẩm định mức
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5 }}>
              {bom.product.productName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Mã: {bom.product.productCode} | Đơn vị: {bom.product.unit}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">
              Phiên bản (Version)
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5 }}>
              {bom.version}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">
              Trạng thái hiệu lực
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Chip label={getStatusLabel(bom.status)} color={getStatusColor(bom.status)} variant="outlined" />
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">
              Ngày bắt đầu hiệu lực
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5 }}>
              {bom.effectiveDate}
            </Typography>
          </Grid>
        </Grid>
        {bom.notes ? (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Ghi chú định mức
            </Typography>
            <Typography variant="body1" sx={{ mt: 0.5 }}>
              {bom.notes}
            </Typography>
          </>
        ) : null}
      </Card>

      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        Danh sách nguyên phụ liệu định mức
      </Typography>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead sx={{ bgcolor: '#f5f7f6' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Mã nguyên phụ liệu</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Tên nguyên phụ liệu</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Phân loại</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Số lượng định mức (trên 1 đv sản phẩm)</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>ĐVT vật tư</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Tỷ lệ hao hụt (%)</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Đặc tính vật tư</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Ghi chú dòng</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bom.items.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell sx={{ fontWeight: 600, color: '#176b5b' }}>{item.material.materialCode}</TableCell>
                <TableCell sx={{ fontWeight: 500 }}>{item.material.materialName}</TableCell>
                <TableCell>
                  <Chip label={item.material.category} size="small" variant="outlined" />
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>{item.quantityPerUnit}</TableCell>
                <TableCell>{item.material.unit}</TableCell>
                <TableCell align="right" sx={{ color: item.wasteRatePercent > 0 ? '#9a4d2f' : 'inherit' }}>
                  {item.wasteRatePercent}%
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Màu: {item.material.color || '-'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    QC: {item.material.specification || '-'}
                  </Typography>
                </TableCell>
                <TableCell>{item.notes || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
