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
  IconButton,
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
import { ArrowBack, Add, Delete } from '@mui/icons-material';
import { Link, useParams } from 'react-router-dom';
import { productionScheduleService } from '../services/productionScheduleService.js';
import { productionLineService } from '../services/productionLineService.js';
import { operationService } from '../services/operationService.js';

export function ProductionScheduleDetailPage() {
  const { id } = useParams();
  const [schedule, setSchedule] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Assignment dialog State
  const [openDialog, setOpenDialog] = useState(false);
  const [lineEmployees, setLineEmployees] = useState([]);
  const [productOps, setProductOps] = useState([]);
  const [formValues, setFormValues] = useState({
    employeeId: '',
    operationId: '',
    assignedQuantity: '',
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
      const response = await productionScheduleService.getScheduleById(id);
      setSchedule(response.data);

      const assignRes = await productionScheduleService.getScheduleAssignments(id);
      setAssignments(assignRes.data);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Không tải được chi tiết kế hoạch');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [id]);

  const loadAssignDropdowns = async () => {
    if (!schedule) return;
    try {
      // 1. Get active employees currently assigned to this line
      const empRes = await productionLineService.getActiveEmployees(schedule.productionLineId);
      setLineEmployees(empRes.data);

      // 2. Get operations flow of the product
      const opRes = await operationService.getProductOperations(schedule.productId);
      setProductOps(opRes.data);
    } catch {
      showSnackbar('Không tải được danh mục thợ may hoặc công đoạn sản phẩm', 'error');
    }
  };

  const handleOpenAssign = () => {
    setFormValues({
      employeeId: '',
      operationId: '',
      assignedQuantity: '',
      notes: '',
    });
    setFormErrors({});
    loadAssignDropdowns();
    setOpenDialog(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formValues.employeeId) errors.employeeId = 'Vui lòng chọn công nhân';
    if (!formValues.operationId) errors.operationId = 'Vui lòng chọn công đoạn';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSubmitLoading(true);
    try {
      const payload = {
        employeeId: Number(formValues.employeeId),
        operationId: Number(formValues.operationId),
        assignedQuantity: formValues.assignedQuantity ? Number(formValues.assignedQuantity) : null,
        notes: formValues.notes.trim() || null,
      };

      await productionScheduleService.assignEmployeeToSchedule(id, payload);
      showSnackbar('Phân công thợ may thành công', 'success');
      setOpenDialog(false);
      loadDetail();
    } catch (err) {
      showSnackbar(err.response?.data?.message ?? 'Lỗi phân công thợ may', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId) => {
    if (window.confirm('Bạn có muốn hủy phân công của công nhân này khỏi ca sản xuất?')) {
      try {
        await productionScheduleService.removeEmployeeFromSchedule(id, assignmentId);
        showSnackbar('Hủy phân công thành công', 'success');
        loadDetail();
      } catch (err) {
        showSnackbar(err.response?.data?.message ?? 'Đã xảy ra lỗi', 'error');
      }
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

  if (error || !schedule) {
    return (
      <Stack spacing={2}>
        <Button startIcon={<ArrowBack />} component={Link} to="/production-schedules" sx={{ alignSelf: 'flex-start' }}>
          Quay lại
        </Button>
        <Alert severity="error">{error || 'Không tìm thấy kế hoạch ca'}</Alert>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button startIcon={<ArrowBack />} component={Link} to="/production-schedules" sx={{ color: '#176b5b' }}>
          Quay lại
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Điều phối ca: {schedule.scheduleDate}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Thông tin ca làm việc
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Chuyền may</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>{schedule.lineName} ({schedule.lineCode})</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Ca sản xuất</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>{schedule.shiftName}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Khung giờ</Typography>
                <Typography variant="body1">{schedule.startTime} - {schedule.endTime}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Lệnh sản xuất</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: '#176b5b' }}>{schedule.productionOrderCode}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Sản phẩm gia công</Typography>
                <Typography variant="body1">{schedule.productName}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Sản lượng mục tiêu</Typography>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>{schedule.targetQuantity} cái</Typography>
              </Grid>
            </Grid>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card variant="outlined" sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Nhân sự tham gia ca
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, color: '#176b5b', mb: 1 }}>
                {assignments.length} <Typography component="span" variant="h6" color="text.secondary">/ {schedule.plannedWorkers} người</Typography>
              </Typography>
              <Chip label={schedule.status} color={schedule.status === 'CONFIRMED' ? 'primary' : 'default'} size="small" />
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card variant="outlined" sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Ma trận phân công vị trí may
              </Typography>
              {['DRAFT', 'CONFIRMED'].includes(schedule.status) && (
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleOpenAssign}
                  sx={{ borderRadius: '8px', bgcolor: '#176b5b', '&:hover': { bgcolor: '#0f5245' } }}
                >
                  Phân công thợ may
                </Button>
              )}
            </Box>

            {assignments.length === 0 ? (
              <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                Ca sản xuất này chưa được phân công thợ may vào các công đoạn ráp.
              </Paper>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f5f7f6' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Mã NV</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Tên thợ may</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Công đoạn đảm nhận</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Mã công đoạn</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Sản lượng khoán</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Ghi chú</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Hành động</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {assignments.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell sx={{ fontWeight: 600 }}>{item.employeeCode}</TableCell>
                        <TableCell sx={{ fontWeight: 500 }}>{item.fullName}</TableCell>
                        <TableCell sx={{ color: '#176b5b', fontWeight: 600 }}>{item.operationName}</TableCell>
                        <TableCell>{item.operationCode}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{item.assignedQuantity || 'Cả ca'}</TableCell>
                        <TableCell>{item.notes || '-'}</TableCell>
                        <TableCell align="right">
                          {['DRAFT', 'CONFIRMED'].includes(schedule.status) && (
                            <IconButton color="error" onClick={() => handleRemoveAssignment(item.id)} title="Hủy phân công">
                              <Delete />
                            </IconButton>
                          )}
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

      {/* Assignment Dialog */}
      <Dialog open={openDialog} onClose={() => !submitLoading && setOpenDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Phân công thợ may vào ca</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Chọn thợ may"
              name="employeeId"
              size="small"
              value={formValues.employeeId}
              onChange={handleInputChange}
              error={!!formErrors.employeeId}
              helperText={formErrors.employeeId}
              fullWidth
              required
            >
              {lineEmployees.map((e) => (
                <MenuItem key={e.id} value={e.id}>{e.fullName} ({e.employeeCode})</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Chọn công đoạn ráp"
              name="operationId"
              size="small"
              value={formValues.operationId}
              onChange={handleInputChange}
              error={!!formErrors.operationId}
              helperText={formErrors.operationId}
              fullWidth
              required
            >
              {productOps.map((op) => (
                <MenuItem key={op.id} value={op.operationId}>
                  Bước {op.sequenceNumber}: {op.operationName} (Time: {op.standardTimeSeconds}s)
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Sản lượng khoán (cái, tùy chọn)"
              name="assignedQuantity"
              type="number"
              size="small"
              value={formValues.assignedQuantity}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              label="Ghi chú phân công"
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
            {submitLoading ? 'Đang phân công...' : 'Xác nhận'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(p => ({ ...p, open: false }))}>
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Stack>
  );
}
