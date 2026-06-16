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
import { Add, Edit, Search } from '@mui/icons-material';
import { productionLineService } from '../services/productionLineService.js';

const lineStatuses = [
  { value: 'ACTIVE', label: 'Hoạt động (ACTIVE)', color: 'success' },
  { value: 'MAINTENANCE', label: 'Bảo trì (MAINTENANCE)', color: 'warning' },
  { value: 'INACTIVE', label: 'Dừng hoạt động (INACTIVE)', color: 'error' },
];

export function ProductionLinesPage() {
  const [lines, setLines] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create');
  const [selectedLine, setSelectedLine] = useState(null);
  const [formValues, setFormValues] = useState({
    lineCode: '',
    lineName: '',
    location: '',
    targetWorkers: 5,
    maximumWorkers: 10,
    status: 'ACTIVE',
    description: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const loadLines = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        search: search.trim() || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
      };
      const response = await productionLineService.list(params);
      setLines(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Không tải được danh sách chuyền may');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLines();
  }, [statusFilter]);

  const handleSearchClick = () => {
    loadLines();
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      loadLines();
    }
  };

  const handleOpenCreate = () => {
    setDialogMode('create');
    setSelectedLine(null);
    setFormValues({
      lineCode: '',
      lineName: '',
      location: '',
      targetWorkers: 5,
      maximumWorkers: 10,
      status: 'ACTIVE',
      description: '',
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleOpenEdit = (line) => {
    setDialogMode('edit');
    setSelectedLine(line);
    setFormValues({
      lineCode: line.lineCode,
      lineName: line.lineName,
      location: line.location || '',
      targetWorkers: line.targetWorkers || 5,
      maximumWorkers: line.maximumWorkers || 10,
      status: line.status,
      description: line.description || '',
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formValues.lineCode.trim()) errors.lineCode = 'Mã chuyền may là bắt buộc';
    if (!formValues.lineName.trim()) errors.lineName = 'Tên chuyền may là bắt buộc';
    if (Number(formValues.targetWorkers) <= 0) errors.targetWorkers = 'Số lượng công nhân mục tiêu phải lớn hơn 0';
    if (Number(formValues.maximumWorkers) <= 0) errors.maximumWorkers = 'Số lượng công nhân tối đa phải lớn hơn 0';
    if (Number(formValues.maximumWorkers) < Number(formValues.targetWorkers)) {
      errors.maximumWorkers = 'Số lượng công nhân tối đa không được nhỏ hơn số lượng mục tiêu';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSubmitLoading(true);
    try {
      if (dialogMode === 'create') {
        await productionLineService.create(formValues);
        setSnackbar({ open: true, message: 'Thêm chuyền may mới thành công', severity: 'success' });
      } else {
        await productionLineService.update(selectedLine.id, formValues);
        setSnackbar({ open: true, message: 'Cập nhật chuyền may thành công', severity: 'success' });
      }
      setOpenDialog(false);
      loadLines();
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Đã xảy ra lỗi khi lưu thông tin';
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
            Quản lý chuyền may
          </Typography>
          <Typography color="text.secondary">
            Danh sách các chuyền may trong nhà xưởng, vị trí, công suất thiết kế.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenCreate}>
          Thêm chuyền may
        </Button>
      </Box>

      {/* Filters */}
      <Card variant="outlined" sx={{ p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Tìm mã hoặc tên chuyền"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              InputProps={{
                endAdornment: (
                  <IconButton onClick={handleSearchClick} edge="end">
                    <Search />
                  </IconButton>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Trạng thái"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">Tất cả trạng thái</MenuItem>
              {lineStatuses.map((st) => (
                <MenuItem key={st.value} value={st.value}>
                  {st.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Card>

      {/* Data Table */}
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
                <TableCell sx={{ fontWeight: 700 }}>Mã chuyền</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tên chuyền</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Vị trí</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">CN Mục tiêu</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">CN Tối đa</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Mô tả</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    Không tìm thấy chuyền may nào
                  </TableCell>
                </TableRow>
              ) : (
                lines.map((line) => {
                  const statusInfo = lineStatuses.find((s) => s.value === line.status) || {
                    label: line.status,
                    color: 'default',
                  };
                  return (
                    <TableRow key={line.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{line.lineCode}</TableCell>
                      <TableCell>{line.lineName}</TableCell>
                      <TableCell>{line.location || '-'}</TableCell>
                      <TableCell align="right">{line.targetWorkers || 0}</TableCell>
                      <TableCell align="right">{line.maximumWorkers || 0}</TableCell>
                      <TableCell>
                        <Chip label={statusInfo.label.split(' ')[0]} color={statusInfo.color} size="small" sx={{ fontWeight: 600 }} />
                      </TableCell>
                      <TableCell>{line.description || '-'}</TableCell>
                      <TableCell align="center">
                        <IconButton color="primary" onClick={() => handleOpenEdit(line)} size="small">
                          <Edit fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog Create/Edit */}
      <Dialog open={openDialog} onClose={() => !submitLoading && setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {dialogMode === 'create' ? 'Thêm chuyền may mới' : 'Cập nhật thông tin chuyền may'}
        </DialogTitle>
        <DialogContent dividers sx={{ py: 2 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Mã chuyền may"
                  disabled={dialogMode === 'edit'}
                  value={formValues.lineCode}
                  onChange={(e) => setFormValues({ ...formValues, lineCode: e.target.value })}
                  error={!!formErrors.lineCode}
                  helperText={formErrors.lineCode}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Tên chuyền may"
                  value={formValues.lineName}
                  onChange={(e) => setFormValues({ ...formValues, lineName: e.target.value })}
                  error={!!formErrors.lineName}
                  helperText={formErrors.lineName}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Vị trí/Khu vực"
                  value={formValues.location}
                  onChange={(e) => setFormValues({ ...formValues, location: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Số lượng công nhân mục tiêu"
                  type="number"
                  value={formValues.targetWorkers}
                  onChange={(e) => setFormValues({ ...formValues, targetWorkers: Number(e.target.value) })}
                  error={!!formErrors.targetWorkers}
                  helperText={formErrors.targetWorkers}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Số lượng công nhân tối đa"
                  type="number"
                  value={formValues.maximumWorkers}
                  onChange={(e) => setFormValues({ ...formValues, maximumWorkers: Number(e.target.value) })}
                  error={!!formErrors.maximumWorkers}
                  helperText={formErrors.maximumWorkers}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label="Trạng thái hoạt động"
                  value={formValues.status}
                  onChange={(e) => setFormValues({ ...formValues, status: e.target.value })}
                >
                  {lineStatuses.map((st) => (
                    <MenuItem key={st.value} value={st.value}>
                      {st.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Mô tả chi tiết"
                  value={formValues.description}
                  onChange={(e) => setFormValues({ ...formValues, description: e.target.value })}
                />
              </Grid>
            </Grid>
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

      {/* Snackbar notification */}
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
