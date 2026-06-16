import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  LinearProgress,
  MenuItem,
  Paper,
  Snackbar,
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
import { ArrowBack, Add } from '@mui/icons-material';
import { Link, useParams } from 'react-router-dom';
import { productionOrderService } from '../services/productionOrderService.js';
import { productionScheduleService } from '../services/productionScheduleService.js';
import { productionLineService } from '../services/productionLineService.js';
import { productionProgressService } from '../services/productionProgressService.js';

export function ProductionOrderDetailPage() {
  const { id } = useParams();
  const [po, setPo] = useState(null);
  const [allocations, setAllocations] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Allocation dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [lines, setLines] = useState([]);
  const [formValues, setFormValues] = useState({
    productionLineId: '',
    allocatedQuantity: 0,
    plannedStartDate: '',
    plannedEndDate: '',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);

  // Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const loadDetail = async () => {
    setLoading(true);
    setError('');
    try {
      const orderRes = await productionOrderService.getById(id);
      setPo(orderRes.data);

      const allocRes = await productionScheduleService.listAllocations({ productionOrderId: id });
      setAllocations(allocRes.data);

      const histRes = await productionProgressService.getProgressHistory(id);
      setHistory(histRes.data);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Không tải được chi tiết lệnh sản xuất');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [id]);

  const loadLines = async () => {
    try {
      const response = await productionLineService.list({ status: 'ACTIVE' });
      setLines(response.data);
    } catch {
      showSnackbar('Không tải được danh sách chuyền may', 'error');
    }
  };

  const handleOpenAllocate = () => {
    if (!po) return;
    setFormValues({
      productionLineId: '',
      allocatedQuantity: po.plannedQuantity - allocations.reduce((sum, item) => sum + item.allocatedQuantity, 0),
      plannedStartDate: po.plannedStartDate,
      plannedEndDate: po.plannedEndDate,
      notes: '',
    });
    setFormErrors({});
    loadLines();
    setOpenDialog(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formValues.productionLineId) errors.productionLineId = 'Vui lòng chọn chuyền may';
    if (Number(formValues.allocatedQuantity) <= 0) errors.allocatedQuantity = 'Số lượng phân bổ phải lớn hơn 0';
    if (new Date(formValues.plannedEndDate) < new Date(formValues.plannedStartDate)) {
      errors.plannedEndDate = 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSubmitLoading(true);
    try {
      const payload = {
        productionOrderId: Number(id),
        productionLineId: Number(formValues.productionLineId),
        allocatedQuantity: Number(formValues.allocatedQuantity),
        plannedStartDate: formValues.plannedStartDate,
        plannedEndDate: formValues.plannedEndDate,
        notes: formValues.notes.trim() || null,
      };

      await productionScheduleService.createAllocation(payload);
      showSnackbar('Phân bổ sản xuất thành công', 'success');
      setOpenDialog(false);
      loadDetail();
    } catch (err) {
      showSnackbar(err.response?.data?.message ?? 'Lỗi phân bổ sản xuất', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !po) {
    return (
      <Stack spacing={2}>
        <Button startIcon={<ArrowBack />} component={Link} to="/production-orders" sx={{ alignSelf: 'flex-start' }}>
          Quay lại
        </Button>
        <Alert severity="error">{error || 'Không tìm thấy lệnh sản xuất'}</Alert>
      </Stack>
    );
  }

  const progressPercent = po.plannedQuantity > 0 ? (po.completedQuantity / po.plannedQuantity) * 100 : 0;
  const totalAllocated = allocations.reduce((sum, item) => sum + item.allocatedQuantity, 0);
  const remainingToAllocate = Math.max(0, po.plannedQuantity - totalAllocated);

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button startIcon={<ArrowBack />} component={Link} to="/production-orders" sx={{ color: '#176b5b' }}>
          Quay lại
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Chi tiết lệnh: {po.productionOrderCode}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card variant="outlined" sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Thông tin chung
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Đơn hàng tham chiếu</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>{po.orderCode}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Sản phẩm gia công</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>{po.productName}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Số lượng kế hoạch</Typography>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>{po.plannedQuantity} cái</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Độ ưu tiên</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={po.priority}
                    color={po.priority === 'URGENT' ? 'error' : po.priority === 'HIGH' ? 'warning' : 'primary'}
                    size="small"
                  />
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Kế hoạch bắt đầu</Typography>
                <Typography variant="body1">{po.plannedStartDate}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Kế hoạch kết thúc</Typography>
                <Typography variant="body1">{po.plannedEndDate}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Thực tế bắt đầu</Typography>
                <Typography variant="body1">{po.actualStartDate || 'Chưa bắt đầu'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Thực tế hoàn thành</Typography>
                <Typography variant="body1">{po.actualEndDate || 'Chưa hoàn thành'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">Ghi chú</Typography>
                <Typography variant="body2">{po.notes || '-'}</Typography>
              </Grid>
            </Grid>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card variant="outlined" sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                Tiến độ sản xuất
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h3" sx={{ fontWeight: 800, mr: 2, color: progressPercent >= 100 ? '#2e7d32' : '#176b5b' }}>
                  {Math.round(progressPercent)}%
                </Typography>
                <Chip
                  label={po.status}
                  color={po.status === 'COMPLETED' ? 'success' : po.status === 'IN_PROGRESS' ? 'info' : 'default'}
                />
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(100, progressPercent)}
                sx={{ height: 10, borderRadius: 5, mb: 3 }}
                color={progressPercent >= 100 ? 'success' : 'primary'}
              />
              <Stack spacing={1} sx={{ bgcolor: '#f8faf9', p: 2, borderRadius: '8px' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Kế hoạch:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{po.plannedQuantity} cái</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Đã hoàn thành đạt:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#2e7d32' }}>{po.completedQuantity} cái</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Số sản phẩm lỗi:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#d32f2f' }}>{po.rejectedQuantity} cái</Typography>
                </Box>
              </Stack>
            </Box>
          </Card>
        </Grid>

        {/* Allocations to production lines */}
        <Grid item xs={12}>
          <Card variant="outlined" sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Phân bổ chuyền may
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Đã phân bổ: {totalAllocated} / {po.plannedQuantity} (Còn lại cần phân bổ: {remainingToAllocate})
                </Typography>
              </Box>
              {['DRAFT', 'PLANNED', 'RELEASED', 'IN_PROGRESS'].includes(po.status) && (
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleOpenAllocate}
                  disabled={remainingToAllocate === 0}
                  sx={{ borderRadius: '8px', bgcolor: '#176b5b', '&:hover': { bgcolor: '#0f5245' } }}
                >
                  Phân bổ cho chuyền
                </Button>
              )}
            </Box>

            {allocations.length === 0 ? (
              <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                Lệnh sản xuất này chưa được phân bổ cho bất kỳ chuyền may nào.
              </Paper>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f5f7f6' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Mã chuyền</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Tên chuyền may</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Số lượng phân bổ</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Thời gian sản xuất</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {allocations.map((alloc) => (
                      <TableRow key={alloc.id}>
                        <TableCell sx={{ fontWeight: 600 }}>{alloc.lineCode}</TableCell>
                        <TableCell sx={{ fontWeight: 500 }}>{alloc.lineName}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{alloc.allocatedQuantity} cái</TableCell>
                        <TableCell>{alloc.plannedStartDate} đến {alloc.plannedEndDate}</TableCell>
                        <TableCell>
                          <Chip label={alloc.status} size="small" color={alloc.status === 'COMPLETED' ? 'success' : 'default'} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        </Grid>

        {/* Snapshot history */}
        <Grid item xs={12}>
          <Card variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Lịch sử ghi nhận tiến độ
            </Typography>
            {history.length === 0 ? (
              <Typography color="text.secondary">Chưa có bản ghi tiến độ nào được ghi nhận.</Typography>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f5f7f6' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Ngày ghi nhận</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Lũy kế hoàn thành</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Phần trăm tiến độ</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Kỳ vọng tiến độ</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Số lượng chậm trễ</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Đánh giá</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {history.map((hItem) => (
                      <TableRow key={hItem.id}>
                        <TableCell>{hItem.snapshotDate}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{hItem.completedQuantity} cái</TableCell>
                        <TableCell>{hItem.progressPercent}%</TableCell>
                        <TableCell>{hItem.expectedProgressPercent}%</TableCell>
                        <TableCell sx={{ color: hItem.delayQuantity > 0 ? 'error.main' : 'inherit', fontWeight: hItem.delayQuantity > 0 ? 600 : 400 }}>
                          {hItem.delayQuantity} cái
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={hItem.status}
                            size="small"
                            color={
                              hItem.status === 'ON_TRACK'
                                ? 'success'
                                : hItem.status === 'AT_RISK'
                                ? 'warning'
                                : hItem.status === 'DELAYED'
                                ? 'error'
                                : 'default'
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        </Grid>
      </Grid>

      {/* Allocation Dialog */}
      <Dialog open={openDialog} onClose={() => !submitLoading && setOpenDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Phân bổ lệnh cho chuyền may</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Chọn chuyền may"
              name="productionLineId"
              size="small"
              value={formValues.productionLineId}
              onChange={handleInputChange}
              error={!!formErrors.productionLineId}
              helperText={formErrors.productionLineId}
              fullWidth
              required
            >
              {lines.map((l) => (
                <MenuItem key={l.id} value={l.id}>{l.lineName} ({l.lineCode})</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Số lượng phân bổ"
              name="allocatedQuantity"
              type="number"
              size="small"
              value={formValues.allocatedQuantity}
              onChange={handleInputChange}
              error={!!formErrors.allocatedQuantity}
              helperText={formErrors.allocatedQuantity}
              fullWidth
              required
            />
            <TextField
              label="Kế hoạch từ ngày"
              name="plannedStartDate"
              placeholder="YYYY-MM-DD"
              size="small"
              value={formValues.plannedStartDate}
              onChange={handleInputChange}
              fullWidth
              required
            />
            <TextField
              label="Kế hoạch đến ngày"
              name="plannedEndDate"
              placeholder="YYYY-MM-DD"
              size="small"
              value={formValues.plannedEndDate}
              onChange={handleInputChange}
              error={!!formErrors.plannedEndDate}
              helperText={formErrors.plannedEndDate}
              fullWidth
              required
            />
            <TextField
              label="Ghi chú phân bổ"
              name="notes"
              size="small"
              value={formValues.notes}
              onChange={handleInputChange}
              multiline
              rows={2}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDialog(false)} disabled={submitLoading}>Hủy</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={submitLoading} sx={{ bgcolor: '#176b5b', '&:hover': { bgcolor: '#0f5245' } }}>
            {submitLoading ? 'Đang phân bổ...' : 'Xác nhận'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(p => ({ ...p, open: false }))}>
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Stack>
  );
}
