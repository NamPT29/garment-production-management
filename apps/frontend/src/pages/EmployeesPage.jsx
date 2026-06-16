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
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { Add, Edit, Search, AssignmentInd, EventBusy } from '@mui/icons-material';
import { employeeService } from '../services/employeeService.js';
import { productionLineService } from '../services/productionLineService.js';

const positions = [
  { value: 'WORKER', label: 'Công nhân may (WORKER)' },
  { value: 'LEADER', label: 'Tổ trưởng (LEADER)' },
  { value: 'TECHNICIAN', label: 'Kỹ thuật chuyền (TECHNICIAN)' },
  { value: 'MANAGER', label: 'Quản lý xưởng (MANAGER)' },
  { value: 'OTHER', label: 'Khác (OTHER)' },
];

const skillLevels = [
  { value: 'BEGINNER', label: 'Bắt đầu (BEGINNER)' },
  { value: 'INTERMEDIATE', label: 'Trung bình (INTERMEDIATE)' },
  { value: 'SKILLED', label: 'Lành nghề (SKILLED)' },
  { value: 'EXPERT', label: 'Chuyên gia (EXPERT)' },
];

const employeeStatuses = [
  { value: 'ACTIVE', label: 'Đang hoạt động (ACTIVE)', color: 'success' },
  { value: 'INACTIVE', label: 'Nghỉ việc (INACTIVE)', color: 'error' },
  { value: 'LEAVE', label: 'Tạm nghỉ/Nghỉ phép (LEAVE)', color: 'warning' },
];

export function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [posFilter, setPosFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dialog state for Employee CRUD
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formValues, setFormValues] = useState({
    employeeCode: '',
    fullName: '',
    dateOfBirth: '',
    gender: 'NU',
    phone: '',
    email: '',
    address: '',
    hireDate: '',
    position: 'WORKER',
    skillLevel: 'INTERMEDIATE',
    status: 'ACTIVE',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);

  // Dialog state for Line Assignment
  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [activeLines, setActiveLines] = useState([]);
  const [assignForm, setAssignForm] = useState({
    productionLineId: '',
    assignedFrom: new Date().toISOString().slice(0, 10),
    isPrimary: true,
  });
  const [assignErrors, setAssignErrors] = useState({});
  const [assignments, setAssignments] = useState([]);
  const [assignmentLoading, setAssignmentLoading] = useState(false);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const loadEmployees = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        search: search.trim() || undefined,
        position: posFilter === 'all' ? undefined : posFilter,
        status: statusFilter === 'all' ? undefined : statusFilter,
      };
      const response = await employeeService.list(params);
      setEmployees(response.data.items || response.data || []);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Không tải được danh sách nhân sự');
    } finally {
      setLoading(false);
    }
  };

  const loadLines = async () => {
    try {
      const response = await productionLineService.list({ status: 'ACTIVE' });
      setActiveLines(response.data || []);
    } catch (err) {
      console.error('Không tải được danh sách chuyền may hoạt động', err);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, [posFilter, statusFilter]);

  useEffect(() => {
    loadLines();
  }, []);

  const handleSearch = () => {
    loadEmployees();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      loadEmployees();
    }
  };

  const handleOpenCreate = () => {
    setDialogMode('create');
    setSelectedEmployee(null);
    setFormValues({
      employeeCode: '',
      fullName: '',
      dateOfBirth: '',
      gender: 'NU',
      phone: '',
      email: '',
      address: '',
      hireDate: new Date().toISOString().slice(0, 10),
      position: 'WORKER',
      skillLevel: 'INTERMEDIATE',
      status: 'ACTIVE',
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleOpenEdit = (emp) => {
    setDialogMode('edit');
    setSelectedEmployee(emp);
    setFormValues({
      employeeCode: emp.employeeCode,
      fullName: emp.fullName,
      dateOfBirth: emp.dateOfBirth ? emp.dateOfBirth.slice(0, 10) : '',
      gender: emp.gender,
      phone: emp.phone || '',
      email: emp.email || '',
      address: emp.address || '',
      hireDate: emp.hireDate ? emp.hireDate.slice(0, 10) : '',
      position: emp.position,
      skillLevel: emp.skillLevel,
      status: emp.status,
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleOpenAssign = async (emp) => {
    setSelectedEmployee(emp);
    setAssignForm({
      productionLineId: emp.currentLineId || '',
      assignedFrom: new Date().toISOString().slice(0, 10),
      isPrimary: true,
    });
    setAssignErrors({});
    setOpenAssignDialog(true);
    loadAssignments(emp.id);
  };

  const loadAssignments = async (empId) => {
    setAssignmentLoading(true);
    try {
      const res = await employeeService.getAssignments(empId);
      setAssignments(res.data || []);
    } catch (err) {
      console.error('Không tải được lịch sử phân chuyền', err);
    } finally {
      setAssignmentLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formValues.employeeCode.trim()) errors.employeeCode = 'Mã nhân viên là bắt buộc';
    if (!formValues.fullName.trim()) errors.fullName = 'Họ và tên là bắt buộc';
    if (!formValues.position) errors.position = 'Vị trí công việc là bắt buộc';
    if (!formValues.skillLevel) errors.skillLevel = 'Trình độ tay nghề là bắt buộc';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSubmitLoading(true);
    try {
      const payload = {
        ...formValues,
        dateOfBirth: formValues.dateOfBirth || null,
        hireDate: formValues.hireDate || null,
      };
      if (dialogMode === 'create') {
        await employeeService.create(payload);
        setSnackbar({ open: true, message: 'Thêm nhân sự mới thành công', severity: 'success' });
      } else {
        await employeeService.update(selectedEmployee.id, payload);
        setSnackbar({ open: true, message: 'Cập nhật nhân sự thành công', severity: 'success' });
      }
      setOpenDialog(false);
      loadEmployees();
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Đã xảy ra lỗi khi lưu nhân sự';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleAssignLine = async () => {
    const errors = {};
    if (!assignForm.productionLineId) errors.productionLineId = 'Chuyền may là bắt buộc';
    if (!assignForm.assignedFrom) errors.assignedFrom = 'Ngày bắt đầu là bắt buộc';
    setAssignErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      await employeeService.assignLine(selectedEmployee.id, {
        productionLineId: Number(assignForm.productionLineId),
        assignedFrom: assignForm.assignedFrom,
        isPrimary: assignForm.isPrimary,
      });
      setSnackbar({ open: true, message: 'Phân bổ chuyền may thành công', severity: 'success' });
      loadAssignments(selectedEmployee.id);
      loadEmployees();
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Lỗi khi phân chuyền (Có thể do đã được phân vào chuyền chính khác)';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    }
  };

  const handleEndAssignment = async (assignId) => {
    try {
      await employeeService.endAssignment(selectedEmployee.id, assignId, {
        assignedTo: new Date().toISOString().slice(0, 10),
      });
      setSnackbar({ open: true, message: 'Đã kết thúc phân bổ chuyền may', severity: 'success' });
      loadAssignments(selectedEmployee.id);
      loadEmployees();
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Đã xảy ra lỗi';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    }
  };

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Quản lý nhân sự sản xuất
          </Typography>
          <Typography color="text.secondary">
            Thông tin hồ sơ công nhân, tổ trưởng, trình độ tay nghề và phân bổ chuyền may.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenCreate}>
          Thêm nhân viên
        </Button>
      </Box>

      {/* Filters */}
      <Card variant="outlined" sx={{ p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              label="Tìm mã, tên, SĐT, email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={handleKeyPress}
              InputProps={{
                endAdornment: (
                  <IconButton onClick={handleSearch} edge="end">
                    <Search />
                  </IconButton>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Vị trí công việc"
              value={posFilter}
              onChange={(e) => setPosFilter(e.target.value)}
            >
              <MenuItem value="all">Tất cả vị trí</MenuItem>
              {positions.map((p) => (
                <MenuItem key={p.value} value={p.value}>
                  {p.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Trạng thái"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">Tất cả trạng thái</MenuItem>
              {employeeStatuses.map((st) => (
                <MenuItem key={st.value} value={st.value}>
                  {st.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Card>

      {/* Main Table */}
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
                <TableCell sx={{ fontWeight: 700 }}>Mã nhân viên</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Họ và tên</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Vị trí</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tay nghề</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Chuyền hiện tại</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Điện thoại</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    Không tìm thấy nhân viên nào
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((emp) => {
                  const statusInfo = employeeStatuses.find((s) => s.value === emp.status) || {
                    label: emp.status,
                    color: 'default',
                  };
                  const posInfo = positions.find((p) => p.value === emp.position)?.label.split(' ')[0] || emp.position;
                  const skillInfo = skillLevels.find((s) => s.value === emp.skillLevel)?.label.split(' ')[0] || emp.skillLevel;
                  return (
                    <TableRow key={emp.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{emp.employeeCode}</TableCell>
                      <TableCell>{emp.fullName}</TableCell>
                      <TableCell>{posInfo}</TableCell>
                      <TableCell>{skillInfo}</TableCell>
                      <TableCell>
                        {emp.currentLineName ? (
                          <Chip label={emp.currentLineName} size="small" variant="outlined" color="primary" />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{emp.phone || '-'}</TableCell>
                      <TableCell>
                        <Chip label={statusInfo.label.split(' ')[0]} color={statusInfo.color} size="small" sx={{ fontWeight: 600 }} />
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <IconButton color="primary" onClick={() => handleOpenEdit(emp)} size="small" title="Sửa thông tin">
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton color="secondary" onClick={() => handleOpenAssign(emp)} size="small" title="Phân phối chuyền">
                            <AssignmentInd fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog Employee Create/Edit */}
      <Dialog open={openDialog} onClose={() => !submitLoading && setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {dialogMode === 'create' ? 'Thêm hồ sơ nhân viên mới' : 'Cập nhật hồ sơ nhân viên'}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Mã nhân viên"
                  disabled={dialogMode === 'edit'}
                  value={formValues.employeeCode}
                  onChange={(e) => setFormValues({ ...formValues, employeeCode: e.target.value })}
                  error={!!formErrors.employeeCode}
                  helperText={formErrors.employeeCode}
                />
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label="Họ và tên"
                  value={formValues.fullName}
                  onChange={(e) => setFormValues({ ...formValues, fullName: e.target.value })}
                  error={!!formErrors.fullName}
                  helperText={formErrors.fullName}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Ngày sinh"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={formValues.dateOfBirth}
                  onChange={(e) => setFormValues({ ...formValues, dateOfBirth: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  label="Giới tính"
                  value={formValues.gender}
                  onChange={(e) => setFormValues({ ...formValues, gender: e.target.value })}
                >
                  <MenuItem value="NAM">Nam</MenuItem>
                  <MenuItem value="NU">Nữ</MenuItem>
                  <MenuItem value="KHAC">Khác</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Điện thoại"
                  value={formValues.phone}
                  onChange={(e) => setFormValues({ ...formValues, phone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formValues.email}
                  onChange={(e) => setFormValues({ ...formValues, email: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Ngày tuyển dụng"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={formValues.hireDate}
                  onChange={(e) => setFormValues({ ...formValues, hireDate: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Địa chỉ thường trú"
                  value={formValues.address}
                  onChange={(e) => setFormValues({ ...formValues, address: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  label="Vị trí công việc"
                  value={formValues.position}
                  onChange={(e) => setFormValues({ ...formValues, position: e.target.value })}
                >
                  {positions.map((p) => (
                    <MenuItem key={p.value} value={p.value}>
                      {p.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  label="Tay nghề chuyên môn"
                  value={formValues.skillLevel}
                  onChange={(e) => setFormValues({ ...formValues, skillLevel: e.target.value })}
                >
                  {skillLevels.map((sl) => (
                    <MenuItem key={sl.value} value={sl.value}>
                      {sl.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  label="Trạng thái làm việc"
                  value={formValues.status}
                  onChange={(e) => setFormValues({ ...formValues, status: e.target.value })}
                >
                  {employeeStatuses.map((st) => (
                    <MenuItem key={st.value} value={st.value}>
                      {st.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={submitLoading}>
            Hủy bỏ
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={submitLoading}>
            {submitLoading ? 'Đang lưu...' : 'Lưu hồ sơ'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Line Assignment History & New Assignment */}
      <Dialog open={openAssignDialog} onClose={() => setOpenAssignDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Điều hành phân chuyền cho: {selectedEmployee?.fullName} ({selectedEmployee?.employeeCode})
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            {/* Left: New Assignment Form */}
            <Grid item xs={12} md={5}>
              <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Phân vào chuyền mới
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    select
                    fullWidth
                    label="Chọn chuyền may"
                    value={assignForm.productionLineId}
                    onChange={(e) => setAssignForm({ ...assignForm, productionLineId: e.target.value })}
                    error={!!assignErrors.productionLineId}
                    helperText={assignErrors.productionLineId}
                  >
                    {activeLines.map((line) => (
                      <MenuItem key={line.id} value={line.id}>
                        {line.lineName} ({line.lineCode})
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    fullWidth
                    type="date"
                    label="Ngày bắt đầu nhận chuyền"
                    InputLabelProps={{ shrink: true }}
                    value={assignForm.assignedFrom}
                    onChange={(e) => setAssignForm({ ...assignForm, assignedFrom: e.target.value })}
                    error={!!assignErrors.assignedFrom}
                    helperText={assignErrors.assignedFrom}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={assignForm.isPrimary}
                        onChange={(e) => setAssignForm({ ...assignForm, isPrimary: e.target.checked })}
                      />
                    }
                    label="Chuyền may chính (Primary)"
                  />
                  <Button variant="contained" onClick={handleAssignLine} startIcon={<Add />} fullWidth sx={{ mt: 1 }}>
                    Xác nhận phân chuyền
                  </Button>
                </Stack>
              </Paper>
            </Grid>

            {/* Right: Assignment History Table */}
            <Grid item xs={12} md={7}>
              <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Lịch sử phân chuyền
                </Typography>
                {assignmentLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={30} />
                  </Box>
                ) : (
                  <TableContainer sx={{ maxHeight: 300 }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: 'action.hover' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Chuyền</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Từ ngày</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Đến ngày</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Loại</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="center">Hành động</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {assignments.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} align="center">
                              Chưa có lịch sử phân chuyền
                            </TableCell>
                          </TableRow>
                        ) : (
                          assignments.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell sx={{ fontWeight: 600 }}>{item.lineName}</TableCell>
                              <TableCell>{item.assignedFrom}</TableCell>
                              <TableCell>{item.assignedTo || 'Hiện tại'}</TableCell>
                              <TableCell>
                                <Chip
                                  label={item.isPrimary ? 'Chính' : 'Phụ'}
                                  color={item.isPrimary ? 'primary' : 'default'}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell align="center">
                                {!item.assignedTo && (
                                  <IconButton
                                    color="error"
                                    onClick={() => handleEndAssignment(item.id)}
                                    size="small"
                                    title="Rút khỏi chuyền"
                                  >
                                    <EventBusy fontSize="small" />
                                  </IconButton>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAssignDialog(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
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
