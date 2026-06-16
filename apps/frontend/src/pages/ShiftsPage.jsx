import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
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
import { Add, Edit } from '@mui/icons-material';
import { shiftService } from '../services/shiftService.js';

export function ShiftsPage() {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create');
  const [selectedShift, setSelectedShift] = useState(null);
  const [formValues, setFormValues] = useState({
    shiftCode: '',
    shiftName: '',
    startTime: '08:00:00',
    endTime: '17:00:00',
    breakMinutes: 60,
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const loadShifts = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await shiftService.list();
      setShifts(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Không tải được danh sách ca làm việc');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShifts();
  }, []);

  const handleOpenCreate = () => {
    setDialogMode('create');
    setSelectedShift(null);
    setFormValues({
      shiftCode: '',
      shiftName: '',
      startTime: '08:00:00',
      endTime: '17:00:00',
      breakMinutes: 60,
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleOpenEdit = (shift) => {
    setDialogMode('edit');
    setSelectedShift(shift);
    setFormValues({
      shiftCode: shift.shiftCode,
      shiftName: shift.shiftName,
      startTime: shift.startTime,
      endTime: shift.endTime,
      breakMinutes: shift.breakMinutes ?? 0,
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formValues.shiftCode.trim()) errors.shiftCode = 'Mã ca làm việc là bắt buộc';
    if (!formValues.shiftName.trim()) errors.shiftName = 'Tên ca làm việc là bắt buộc';
    if (!formValues.startTime) errors.startTime = 'Giờ bắt đầu là bắt buộc';
    if (!formValues.endTime) errors.endTime = 'Giờ kết thúc là bắt buộc';
    if (formValues.startTime === formValues.endTime) {
      errors.endTime = 'Giờ kết thúc không được trùng với giờ bắt đầu';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSubmitLoading(true);
    try {
      if (dialogMode === 'create') {
        await shiftService.create(formValues);
        setSnackbar({ open: true, message: 'Thêm ca làm việc mới thành công', severity: 'success' });
      } else {
        await shiftService.update(selectedShift.id, formValues);
        setSnackbar({ open: true, message: 'Cập nhật ca làm việc thành công', severity: 'success' });
      }
      setOpenDialog(false);
      loadShifts();
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Đã xảy ra lỗi khi lưu thông tin ca';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Quản lý ca làm việc
          </Typography>
          <Typography color="text.secondary">
            Thiết lập các ca làm việc trong ngày (ca sáng, ca chiều, ca gãy, tăng ca) kèm khung giờ và thời gian nghỉ.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenCreate}>
          Thêm ca làm việc
        </Button>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Mã ca</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tên ca làm việc</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Giờ bắt đầu</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Giờ kết thúc</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Phút nghỉ</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {shifts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Chưa thiết lập ca làm việc nào
                  </TableCell>
                </TableRow>
              ) : (
                shifts.map((shift) => (
                  <TableRow key={shift.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{shift.shiftCode}</TableCell>
                    <TableCell>{shift.shiftName}</TableCell>
                    <TableCell>{shift.startTime}</TableCell>
                    <TableCell>{shift.endTime}</TableCell>
                    <TableCell align="right">{shift.breakMinutes ?? 0}</TableCell>
                    <TableCell align="center">
                      <IconButton color="primary" onClick={() => handleOpenEdit(shift)} size="small">
                        <Edit fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog Create/Edit */}
      <Dialog open={openDialog} onClose={() => !submitLoading && setOpenDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {dialogMode === 'create' ? 'Thêm ca làm việc mới' : 'Cập nhật ca làm việc'}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Mã ca làm việc"
              disabled={dialogMode === 'edit'}
              value={formValues.shiftCode}
              onChange={(e) => setFormValues({ ...formValues, shiftCode: e.target.value })}
              error={!!formErrors.shiftCode}
              helperText={formErrors.shiftCode}
            />
            <TextField
              fullWidth
              label="Tên ca làm việc"
              value={formValues.shiftName}
              onChange={(e) => setFormValues({ ...formValues, shiftName: e.target.value })}
              error={!!formErrors.shiftName}
              helperText={formErrors.shiftName}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="time"
                  label="Giờ bắt đầu"
                  InputLabelProps={{ shrink: true }}
                  value={formValues.startTime}
                  onChange={(e) => setFormValues({ ...formValues, startTime: e.target.value })}
                  error={!!formErrors.startTime}
                  helperText={formErrors.startTime}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="time"
                  label="Giờ kết thúc"
                  InputLabelProps={{ shrink: true }}
                  value={formValues.endTime}
                  onChange={(e) => setFormValues({ ...formValues, endTime: e.target.value })}
                  error={!!formErrors.endTime}
                  helperText={formErrors.endTime}
                />
              </Grid>
            </Grid>
            <TextField
              fullWidth
              type="number"
              label="Số phút nghỉ ngơi"
              value={formValues.breakMinutes}
              onChange={(e) => setFormValues({ ...formValues, breakMinutes: Number(e.target.value) })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={submitLoading}>
            Hủy bỏ
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={submitLoading}>
            {submitLoading ? 'Đang lưu...' : 'Lưu lại'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
