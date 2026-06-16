import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  Grid,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { productionScheduleService } from '../services/productionScheduleService.js';
import { productionLineService } from '../services/productionLineService.js';
import { shiftService } from '../services/shiftService.js';

export function ProductionScheduleFormPage() {
  const navigate = useNavigate();
  const [allocations, setAllocations] = useState([]);
  const [lines, setLines] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Form values
  const [formValues, setFormValues] = useState({
    productionAllocationId: '',
    productionLineId: '',
    shiftId: '',
    scheduleDate: new Date().toISOString().slice(0, 10),
    targetQuantity: 20,
    plannedWorkers: 5,
    status: 'DRAFT',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState({});

  // Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const loadDropdowns = async () => {
    try {
      const allocRes = await productionScheduleService.listAllocations({ status: 'PLANNED' });
      setAllocations(allocRes.data);

      const lineRes = await productionLineService.list({ status: 'ACTIVE' });
      setLines(lineRes.data);

      const shiftRes = await shiftService.list();
      setShifts(shiftRes.data);
    } catch {
      showSnackbar('Không tải được danh mục phục vụ lập lịch', 'error');
    }
  };

  useEffect(() => {
    loadDropdowns();
  }, []);

  const handleAllocationChange = (e) => {
    const allocId = Number(e.target.value);
    const selectedAlloc = allocations.find((a) => a.id === allocId);
    if (selectedAlloc) {
      setFormValues((prev) => ({
        ...prev,
        productionAllocationId: allocId,
        productionLineId: selectedAlloc.productionLineId,
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formValues.productionAllocationId) errors.productionAllocationId = 'Vui lòng chọn phân bổ sản xuất';
    if (!formValues.productionLineId) errors.productionLineId = 'Vui lòng chọn chuyền may';
    if (!formValues.shiftId) errors.shiftId = 'Vui lòng chọn ca làm việc';
    if (!formValues.scheduleDate) errors.scheduleDate = 'Vui lòng chọn ngày sản xuất';
    if (Number(formValues.targetQuantity) <= 0) errors.targetQuantity = 'Mục tiêu phải lớn hơn 0';
    if (Number(formValues.plannedWorkers) <= 0) errors.plannedWorkers = 'Số lượng công nhân phải lớn hơn 0';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitLoading(true);
    try {
      const payload = {
        ...formValues,
        productionAllocationId: Number(formValues.productionAllocationId),
        productionLineId: Number(formValues.productionLineId),
        shiftId: Number(formValues.shiftId),
        targetQuantity: Number(formValues.targetQuantity),
        plannedWorkers: Number(formValues.plannedWorkers),
        notes: formValues.notes.trim() || null,
      };

      await productionScheduleService.createSchedule(payload);
      showSnackbar('Lập lịch sản xuất ca thành công', 'success');
      window.setTimeout(() => {
        navigate('/production-schedules');
      }, 1000);
    } catch (err) {
      showSnackbar(err.response?.data?.message ?? 'Lỗi lập lịch sản xuất ca', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  return (
    <Stack spacing={3} sx={{ maxWidth: 700, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button startIcon={<ArrowBack />} component={Link} to="/production-schedules" variant="text" sx={{ color: '#176b5b' }}>
          Quay lại
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Lập lịch sản xuất ca
        </Typography>
      </Box>

      <Card variant="outlined" sx={{ p: 4 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                select
                label="Chọn phân bổ lệnh"
                name="productionAllocationId"
                size="small"
                value={formValues.productionAllocationId}
                onChange={handleAllocationChange}
                error={!!formErrors.productionAllocationId}
                helperText={formErrors.productionAllocationId}
                fullWidth
                required
              >
                {allocations.map((a) => (
                  <MenuItem key={a.id} value={a.id}>
                    {a.productionOrderCode} - {a.productName} ({a.lineName} - Qty: {a.allocatedQuantity})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                select
                label="Chuyền may"
                name="productionLineId"
                size="small"
                value={formValues.productionLineId}
                onChange={handleInputChange}
                error={!!formErrors.productionLineId}
                helperText={formErrors.productionLineId}
                fullWidth
                disabled // Auto filled from allocation
              >
                {lines.map((l) => (
                  <MenuItem key={l.id} value={l.id}>{l.lineName}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                label="Chọn ca làm việc"
                name="shiftId"
                size="small"
                value={formValues.shiftId}
                onChange={handleInputChange}
                error={!!formErrors.shiftId}
                helperText={formErrors.shiftId}
                fullWidth
                required
              >
                {shifts.map((s) => (
                  <MenuItem key={s.id} value={s.id}>{s.shiftName} ({s.startTime} - {s.endTime})</MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                type="date"
                label="Ngày sản xuất"
                name="scheduleDate"
                size="small"
                InputLabelProps={{ shrink: true }}
                value={formValues.scheduleDate}
                onChange={handleInputChange}
                error={!!formErrors.scheduleDate}
                helperText={formErrors.scheduleDate}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Sản lượng mục tiêu ca"
                name="targetQuantity"
                type="number"
                size="small"
                value={formValues.targetQuantity}
                onChange={handleInputChange}
                error={!!formErrors.targetQuantity}
                helperText={formErrors.targetQuantity}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Số công nhân kế hoạch"
                name="plannedWorkers"
                type="number"
                size="small"
                value={formValues.plannedWorkers}
                onChange={handleInputChange}
                error={!!formErrors.plannedWorkers}
                helperText={formErrors.plannedWorkers}
                fullWidth
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                select
                label="Trạng thái"
                name="status"
                size="small"
                value={formValues.status}
                onChange={handleInputChange}
                fullWidth
              >
                <MenuItem value="DRAFT">Nháp (DRAFT)</MenuItem>
                <MenuItem value="CONFIRMED">Xác nhận lịch (CONFIRMED)</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Ghi chú kế hoạch ca"
                name="notes"
                size="small"
                value={formValues.notes}
                onChange={handleInputChange}
                multiline
                rows={2}
                fullWidth
              />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
            <Button variant="outlined" component={Link} to="/production-schedules" disabled={submitLoading}>
              Hủy
            </Button>
            <Button
              variant="contained"
              type="submit"
              disabled={submitLoading}
              sx={{ bgcolor: '#176b5b', '&:hover': { bgcolor: '#0f5245' } }}
            >
              Lưu kế hoạch ca
            </Button>
          </Box>
        </Box>
      </Card>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(p => ({ ...p, open: false }))}>
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Stack>
  );
}
