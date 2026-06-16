import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  Grid,
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
import { ArrowBack, Save } from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { productionScheduleService } from '../services/productionScheduleService.js';
import { productionOutputService } from '../services/productionOutputService.js';

export function ProductionOutputFormPage() {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Main output values
  const [outputValues, setOutputValues] = useState({
    goodQuantity: 0,
    defectQuantity: 0,
    reworkQuantity: 0,
    workingMinutes: 480,
    downtimeMinutes: 0,
    outputDate: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  // Employee rows values
  const [employeeRows, setEmployeeRows] = useState([]);

  // Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const loadSchedules = async () => {
    try {
      const response = await productionScheduleService.listSchedules();
      // Filter schedules that are active and not cancelled/completed
      const activeScheds = response.data.filter(s => ['CONFIRMED', 'IN_PROGRESS'].includes(s.status));
      setSchedules(activeScheds);
    } catch {
      showSnackbar('Không tải được danh sách kế hoạch ca sản xuất', 'error');
    }
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  const handleScheduleChange = async (e) => {
    const schedId = Number(e.target.value);
    setSelectedScheduleId(schedId);

    const sched = schedules.find((s) => s.id === schedId);
    setSelectedSchedule(sched);

    if (sched) {
      // Load workers assignments for this schedule
      try {
        const response = await productionScheduleService.getScheduleAssignments(schedId);
        const assigns = response.data;
        // Initialize employee rows
        setEmployeeRows(
          assigns.map((a) => ({
            employeeId: a.employeeId,
            fullName: a.fullName,
            employeeCode: a.employeeCode,
            operationId: a.operationId,
            operationName: a.operationName,
            goodQuantity: 0,
            defectQuantity: 0,
            workingMinutes: 480,
            notes: '',
          }))
        );
      } catch {
        showSnackbar('Không tải được danh sách thợ may đã phân công', 'error');
      }
    }
  };

  const handleOutputInputChange = (e) => {
    const { name, value } = e.target;
    setOutputValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleEmployeeRowChange = (index, field, value) => {
    setEmployeeRows((prev) => {
      const updated = [...prev];
      updated[index][field] = Number(value) || 0;

      // Automatically recalculate main goodQuantity & defectQuantity
      // The line final output is usually represented by the final step.
      // But for total summary, let's take the max goodQuantity among workers or sum them.
      // Actually, let's make the total line output equal to the output of the final operation in the sequence.
      // Or we can just sum all worker outputs, or let the user input it.
      // Let's compute a recommended total:
      // Let's say, we sum goodQuantity & defectQuantity from the workers, or just take the final step.
      // Let's sum them for simplicity or allow the user to modify it.
      // Average or max calculation below
      
      // Let's calculate the average or simply let the user adjust the final total.
      // Let's set it as a default, but allow them to overwrite.
      // Actually, let's auto-fill the main total as the maximum worker output of the final operation,
      // or simply sum of all operations if they are independent.
      // In a sewing line, the line's final completed output is the count of the LAST operation in the sequence.
      // Let's check which is the last operation, or just default to the max of all worker outputs.
      const maxGood = Math.max(...updated.map(r => r.goodQuantity), 0);
      const maxDefect = Math.max(...updated.map(r => r.defectQuantity), 0);

      setOutputValues((prevOut) => ({
        ...prevOut,
        goodQuantity: maxGood,
        defectQuantity: maxDefect,
      }));

      return updated;
    });
  };

  const validateForm = () => {
    if (!selectedScheduleId) {
      showSnackbar('Vui lòng chọn ca kế hoạch sản xuất', 'error');
      return false;
    }
    if (Number(outputValues.goodQuantity) < 0 || Number(outputValues.defectQuantity) < 0) {
      showSnackbar('Số lượng sản xuất không được âm', 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitLoading(true);
    try {
      const payload = {
        productionScheduleId: Number(selectedScheduleId),
        productionOrderId: selectedSchedule.productionOrderId,
        productionLineId: selectedSchedule.productionLineId,
        shiftId: selectedSchedule.shiftId,
        goodQuantity: Number(outputValues.goodQuantity),
        defectQuantity: Number(outputValues.defectQuantity),
        reworkQuantity: Number(outputValues.reworkQuantity),
        workingMinutes: Number(outputValues.workingMinutes),
        downtimeMinutes: Number(outputValues.downtimeMinutes),
        outputDate: outputValues.outputDate,
        notes: outputValues.notes.trim() || null,
      };

      await productionOutputService.create(payload);
      showSnackbar('Báo cáo sản lượng ca thành công', 'success');
      window.setTimeout(() => {
        navigate('/production-outputs');
      }, 1000);
    } catch (err) {
      showSnackbar(err.response?.data?.message ?? 'Đã xảy ra lỗi khi báo cáo sản lượng', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  return (
    <Stack spacing={3} sx={{ maxWidth: 900, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button startIcon={<ArrowBack />} component={Link} to="/production-outputs" variant="text" sx={{ color: '#176b5b' }}>
          Quay lại
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Báo cáo sản lượng ca sản xuất
        </Typography>
      </Box>

      <Card variant="outlined" sx={{ p: 4 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                select
                label="Chọn kế hoạch ca sản xuất hoạt động"
                size="small"
                value={selectedScheduleId}
                onChange={handleScheduleChange}
                fullWidth
                required
              >
                {schedules.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    Ngày {s.scheduleDate} - {s.lineName} - {s.shiftName} (Lệnh: {s.productionOrderCode})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {selectedSchedule && (
              <>
                <Grid item xs={12}>
                  <Box sx={{ p: 2, bgcolor: '#f8faf9', borderRadius: '8px', border: '1px solid #d9e1dd' }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6} md={3}>
                        <Typography variant="caption" color="text.secondary">Chuyền may</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedSchedule.lineName}</Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="caption" color="text.secondary">Ca làm việc</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedSchedule.shiftName}</Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="caption" color="text.secondary">Sản phẩm</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedSchedule.productName}</Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="caption" color="text.secondary">Mục tiêu ca</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedSchedule.targetQuantity} cái</Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    type="date"
                    label="Ngày báo cáo sản lượng"
                    name="outputDate"
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    value={outputValues.outputDate}
                    onChange={handleOutputInputChange}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Tổng sản lượng đạt chuyền"
                    name="goodQuantity"
                    type="number"
                    size="small"
                    value={outputValues.goodQuantity}
                    onChange={handleOutputInputChange}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Tổng sản lượng lỗi chuyền"
                    name="defectQuantity"
                    type="number"
                    size="small"
                    value={outputValues.defectQuantity}
                    onChange={handleOutputInputChange}
                    fullWidth
                    required
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    label="Số lượng sửa lại (rework)"
                    name="reworkQuantity"
                    type="number"
                    size="small"
                    value={outputValues.reworkQuantity}
                    onChange={handleOutputInputChange}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Thời gian chạy chuyền (phút)"
                    name="workingMinutes"
                    type="number"
                    size="small"
                    value={outputValues.workingMinutes}
                    onChange={handleOutputInputChange}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Thời gian dừng chuyền (phút)"
                    name="downtimeMinutes"
                    type="number"
                    size="small"
                    value={outputValues.downtimeMinutes}
                    onChange={handleOutputInputChange}
                    fullWidth
                  />
                </Grid>


                <Grid item xs={12}>
                  <TextField
                    label="Ghi chú báo cáo"
                    name="notes"
                    size="small"
                    value={outputValues.notes}
                    onChange={handleOutputInputChange}
                    multiline
                    rows={2}
                    fullWidth
                  />
                </Grid>
              </>
            )}
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
            <Button variant="outlined" component={Link} to="/production-outputs" disabled={submitLoading}>
              Hủy
            </Button>
            <Button
              variant="contained"
              type="submit"
              startIcon={<Save />}
              disabled={submitLoading}
              sx={{ bgcolor: '#176b5b', '&:hover': { bgcolor: '#0f5245' } }}
            >
              {submitLoading ? 'Đang lưu báo cáo...' : 'Nộp báo cáo sản lượng'}
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
