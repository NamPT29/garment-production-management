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
import { ArrowBack } from '@mui/icons-material';
import { Link, useParams } from 'react-router-dom';
import { inventoryService } from '../services/inventoryService.js';

export function InventoryTransactionDetailPage() {
  const { id } = useParams();
  const [tx, setTx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadTransaction = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await inventoryService.getTransactionById(id);
      setTx(response.data);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Không tải được chi tiết phiếu kho');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransaction();
  }, [id]);

  const getTxTypeLabel = (type) => {
    switch (type) {
      case 'RECEIPT':
        return 'Nhập kho (RECEIPT)';
      case 'ISSUE':
        return 'Xuất kho (ISSUE)';
      case 'ADJUSTMENT_IN':
        return 'Điều chỉnh tăng (ADJUSTMENT_IN)';
      case 'ADJUSTMENT_OUT':
        return 'Điều chỉnh giảm (ADJUSTMENT_OUT)';
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (error || !tx) {
    return (
      <Stack spacing={2}>
        <Button startIcon={<ArrowBack />} component={Link} to="/inventory/transactions" sx={{ alignSelf: 'flex-start' }}>
          Quay lại lịch sử kho
        </Button>
        <Alert severity="error">{error || 'Không tìm thấy chi tiết phiếu kho'}</Alert>
      </Stack>
    );
  }

  // Calculate totals
  const totalQuantity = tx.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = tx.items.reduce((sum, item) => sum + (item.quantity * (item.unitCost ?? 0)), 0);

  return (
    <Stack spacing={3}>
      <Box>
        <Button startIcon={<ArrowBack />} component={Link} to="/inventory/transactions" sx={{ mb: 2 }}>
          Quay lại lịch sử kho
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Chi tiết phiếu kho: {tx.transactionCode}
        </Typography>
        <Typography color="text.secondary">
          Loại phiếu: <Chip label={getTxTypeLabel(tx.transactionType)} color={getTxTypeColor(tx.transactionType)} size="small" variant="outlined" sx={{ ml: 1 }} />
        </Typography>
      </Box>

      <Card variant="outlined" sx={{ p: 3, bgcolor: '#ffffff' }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">
              Kho hàng thực hiện
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 0.5 }}>
              {tx.warehouse.warehouseName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Mã: {tx.warehouse.warehouseCode}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">
              Ngày thực hiện giao dịch
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 0.5 }}>
              {tx.transactionDate}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">
              Số chứng từ tham chiếu
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 0.5 }}>
              {tx.referenceNumber || '-'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">
              Đối tác liên kết
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 0.5 }}>
              {tx.supplier ? `Nhà cung cấp: ${tx.supplier.supplierName}` : ''}
              {tx.order ? `Đơn hàng: ${tx.order.orderCode}` : ''}
              {!tx.supplier && !tx.order ? 'Không có' : ''}
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">
              Người lập phiếu
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 0.5 }}>
              {tx.createdByUser?.fullName || tx.createdByUser?.username || '-'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">
              Người ghi sổ (Posted by)
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 0.5 }}>
              {tx.postedByUser?.fullName || tx.postedByUser?.username || '-'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">
              Thời gian ghi sổ
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 0.5 }}>
              {tx.postedAt ? new Date(tx.postedAt).toLocaleString() : '-'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">
              Trạng thái
            </Typography>
            <Box sx={{ mt: 0.5 }}>
              <Chip label={tx.status} color={tx.status === 'POSTED' ? 'success' : 'default'} size="small" />
            </Box>
          </Grid>
        </Grid>

        {tx.notes ? (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Ghi chú lý do / Diễn giải
            </Typography>
            <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500 }}>
              {tx.notes}
            </Typography>
          </>
        ) : null}
      </Card>

      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        Chi tiết danh mục nguyên phụ liệu
      </Typography>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead sx={{ bgcolor: '#f5f7f6' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Mã nguyên phụ liệu</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Tên nguyên phụ liệu</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Phân loại</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Số lượng thực tế</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>ĐVT</TableCell>
              {tx.transactionType === 'RECEIPT' ? (
                <>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Đơn giá (VNĐ)</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Thành tiền (VNĐ)</TableCell>
                </>
              ) : null}
              <TableCell sx={{ fontWeight: 700 }}>Ghi chú dòng</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tx.items.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell sx={{ fontWeight: 600, color: '#176b5b' }}>{item.materialCode}</TableCell>
                <TableCell sx={{ fontWeight: 500 }}>{item.materialName}</TableCell>
                <TableCell>
                  <Chip label={item.category} size="small" variant="outlined" />
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>{item.quantity.toLocaleString()}</TableCell>
                <TableCell>{item.unit}</TableCell>
                {tx.transactionType === 'RECEIPT' ? (
                  <>
                    <TableCell align="right">{(item.unitCost ?? 0).toLocaleString()}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#176b5b' }}>
                      {(item.quantity * (item.unitCost ?? 0)).toLocaleString()}
                    </TableCell>
                  </>
                ) : null}
                <TableCell>{item.notes || '-'}</TableCell>
              </TableRow>
            ))}
            
            {/* Totals Row */}
            <TableRow sx={{ bgcolor: '#fbfdfc' }}>
              <TableCell colSpan={3} sx={{ fontWeight: 700 }}>Tổng cộng</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800 }}>{totalQuantity.toLocaleString()}</TableCell>
              <TableCell colSpan={tx.transactionType === 'RECEIPT' ? 2 : 1}></TableCell>
              {tx.transactionType === 'RECEIPT' ? (
                <TableCell align="right" sx={{ fontWeight: 800, color: '#176b5b', fontSize: '1.05rem' }}>
                  {totalValue.toLocaleString()}
                </TableCell>
              ) : null}
              <TableCell></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}
