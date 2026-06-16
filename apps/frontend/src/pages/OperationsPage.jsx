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
  Tabs,
  Tab,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { operationService } from '../services/operationService.js';
import { productService } from '../services/productService.js';

const difficulties = [
  { value: 'EASY', label: 'Dễ (EASY)', color: 'success' },
  { value: 'MEDIUM', label: 'Trung bình (MEDIUM)', color: 'info' },
  { value: 'HARD', label: 'Khó (HARD)', color: 'warning' },
  { value: 'VERY_HARD', label: 'Rất khó (VERY_HARD)', color: 'error' },
];

const skillLevels = [
  { value: 'BEGINNER', label: 'Mới bắt đầu (BEGINNER)' },
  { value: 'INTERMEDIATE', label: 'Trung bình (INTERMEDIATE)' },
  { value: 'SKILLED', label: 'Lành nghề (SKILLED)' },
  { value: 'EXPERT', label: 'Chuyên gia (EXPERT)' },
];

export function OperationsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  // const [error, setError] = useState('');

  // === Tab 1: Standard Operations State ===
  const [stdOps, setStdOps] = useState([]);
  const [stdDialogOpen, setStdDialogOpen] = useState(false);
  const [stdDialogMode, setStdDialogMode] = useState('create');
  const [selectedStdOp, setSelectedStdOp] = useState(null);
  const [stdForm, setStdForm] = useState({
    operationCode: '',
    operationName: '',
    standardTimeSeconds: 60,
    difficultyLevel: 'MEDIUM',
    description: '',
  });
  const [stdErrors, setStdErrors] = useState({});

  // === Tab 2: Product Flow State ===
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [productOps, setProductOps] = useState([]);
  const [flowDialogOpen, setFlowDialogOpen] = useState(false);
  const [flowDialogMode, setFlowDialogMode] = useState('create');
  const [selectedFlowOp, setSelectedFlowOp] = useState(null);
  const [flowForm, setFlowForm] = useState({
    operationId: '',
    sequenceNumber: 1,
    standardTimeSeconds: 60,
    requiredSkillLevel: 'INTERMEDIATE',
  });
  const [flowErrors, setFlowErrors] = useState({});

  // Common Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [submitLoading, setSubmitLoading] = useState(false);

  const loadStandardOps = async () => {
    setLoading(true);
    try {
      const res = await operationService.list();
      setStdOps(res.data || []);
    } catch {
      console.error('Không tải được danh sách công đoạn tiêu chuẩn');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await productService.list({ page: 1, limit: 100 });
      setProducts(res.data.items || res.data || []);
    } catch (err) {
      console.error('Không tải được danh sách sản phẩm', err);
    }
  };

  const loadProductOpsFlow = async (productId) => {
    if (!productId) {
      setProductOps([]);
      return;
    }
    setLoading(true);
    try {
      const res = await operationService.getProductOperations(productId);
      setProductOps(res.data || []);
    } catch (err) {
      console.error('Không tải được quy trình sản phẩm', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 0) {
      loadStandardOps();
    } else {
      loadProducts();
      if (selectedProductId) {
        loadProductOpsFlow(selectedProductId);
      } else {
        setProductOps([]);
        setLoading(false);
      }
    }
  }, [activeTab]);

  const handleProductChange = (e) => {
    const prodId = e.target.value;
    setSelectedProductId(prodId);
    loadProductOpsFlow(prodId);
  };

  // === Std Operations Handlers ===
  const handleOpenCreateStd = () => {
    setStdDialogMode('create');
    setSelectedStdOp(null);
    setStdForm({
      operationCode: '',
      operationName: '',
      standardTimeSeconds: 60,
      difficultyLevel: 'MEDIUM',
      description: '',
    });
    setStdErrors({});
    setStdDialogOpen(true);
  };

  const handleOpenEditStd = (op) => {
    setStdDialogMode('edit');
    setSelectedStdOp(op);
    setStdForm({
      operationCode: op.operationCode,
      operationName: op.operationName,
      standardTimeSeconds: op.standardTimeSeconds || 60,
      difficultyLevel: op.difficultyLevel,
      description: op.description || '',
    });
    setStdErrors({});
    setStdDialogOpen(true);
  };

  const handleSaveStd = async () => {
    const errors = {};
    if (!stdForm.operationCode.trim()) errors.operationCode = 'Mã công đoạn là bắt buộc';
    if (!stdForm.operationName.trim()) errors.operationName = 'Tên công đoạn là bắt buộc';
    if (Number(stdForm.standardTimeSeconds) <= 0) errors.standardTimeSeconds = 'Thời gian định mức phải lớn hơn 0';
    setStdErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitLoading(true);
    try {
      if (stdDialogMode === 'create') {
        await operationService.create(stdForm);
        setSnackbar({ open: true, message: 'Tạo công đoạn thành công', severity: 'success' });
      } else {
        await operationService.update(selectedStdOp.id, stdForm);
        setSnackbar({ open: true, message: 'Cập nhật công đoạn thành công', severity: 'success' });
      }
      setStdDialogOpen(false);
      loadStandardOps();
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Đã xảy ra lỗi khi lưu thông tin';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setSubmitLoading(false);
    }
  };

  // === Product Flow Handlers ===
  const handleOpenCreateFlow = () => {
    if (!selectedProductId) {
      setSnackbar({ open: true, message: 'Vui lòng chọn sản phẩm trước', severity: 'warning' });
      return;
    }
    setFlowDialogMode('create');
    setSelectedFlowOp(null);
    setFlowForm({
      operationId: '',
      sequenceNumber: productOps.length + 1,
      standardTimeSeconds: 60,
      requiredSkillLevel: 'INTERMEDIATE',
    });
    setFlowErrors({});
    loadStandardOps(); // Make sure we have the operations list
    setFlowDialogOpen(true);
  };

  const handleOpenEditFlow = (flowOp) => {
    setFlowDialogMode('edit');
    setSelectedFlowOp(flowOp);
    setFlowForm({
      operationId: flowOp.operationId,
      sequenceNumber: flowOp.sequenceNumber,
      standardTimeSeconds: flowOp.standardTimeSeconds || 60,
      requiredSkillLevel: flowOp.requiredSkillLevel,
    });
    setFlowErrors({});
    loadStandardOps();
    setFlowDialogOpen(true);
  };

  const handleSaveFlow = async () => {
    const errors = {};
    if (!flowForm.operationId) errors.operationId = 'Công đoạn là bắt buộc';
    if (Number(flowForm.sequenceNumber) <= 0) errors.sequenceNumber = 'Số thứ tự phải lớn hơn 0';
    if (Number(flowForm.standardTimeSeconds) <= 0) errors.standardTimeSeconds = 'Thời gian định mức phải lớn hơn 0';
    setFlowErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitLoading(true);
    try {
      if (flowDialogMode === 'create') {
        await operationService.addProductOperation(selectedProductId, flowForm);
        setSnackbar({ open: true, message: 'Thêm công đoạn vào quy trình thành công', severity: 'success' });
      } else {
        await operationService.updateProductOperation(selectedProductId, selectedFlowOp.id, flowForm);
        setSnackbar({ open: true, message: 'Cập nhật công đoạn quy trình thành công', severity: 'success' });
      }
      setFlowDialogOpen(false);
      loadProductOpsFlow(selectedProductId);
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Đã xảy ra lỗi (Có thể do trùng số thứ tự quy trình)';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteFlow = async (flowOpId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa công đoạn này khỏi quy trình của sản phẩm?')) return;
    try {
      await operationService.removeProductOperation(selectedProductId, flowOpId);
      setSnackbar({ open: true, message: 'Đã xóa công đoạn khỏi quy trình', severity: 'success' });
      loadProductOpsFlow(selectedProductId);
    } catch {
      setSnackbar({ open: true, message: 'Không thể xóa công đoạn quy trình này', severity: 'error' });
    }
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Danh mục công đoạn & Quy trình sản xuất
        </Typography>
        <Typography color="text.secondary">
          Thiết lập các công đoạn chuẩn và xây dựng quy trình lắp ráp sản phẩm (áo thun, áo sơ mi, quần tây...).
        </Typography>
      </Box>

      {/* Tabs Layout */}
      <Paper variant="outlined" sx={{ bgcolor: 'background.paper' }}>
        <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)} borderbottom="1px solid divider">
          <Tab label="Danh mục công đoạn chuẩn" sx={{ fontWeight: 600 }} />
          <Tab label="Quy trình lắp ráp sản phẩm" sx={{ fontWeight: 600 }} />
        </Tabs>
      </Paper>

      {activeTab === 0 ? (
        // === Tab 1 content ===
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" startIcon={<Add />} onClick={handleOpenCreateStd}>
              Thêm công đoạn chuẩn
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Mã công đoạn</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Tên công đoạn</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Định mức (Giây)</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Độ khó</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Mô tả</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stdOps.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        Chưa thiết lập công đoạn nào
                      </TableCell>
                    </TableRow>
                  ) : (
                    stdOps.map((op) => {
                      const diffInfo = difficulties.find((d) => d.value === op.difficultyLevel) || {
                        label: op.difficultyLevel,
                        color: 'default',
                      };
                      return (
                        <TableRow key={op.id} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{op.operationCode}</TableCell>
                          <TableCell>{op.operationName}</TableCell>
                          <TableCell align="right">{op.standardTimeSeconds}</TableCell>
                          <TableCell>
                            <Chip label={diffInfo.label.split(' ')[0]} color={diffInfo.color} size="small" sx={{ fontWeight: 600 }} />
                          </TableCell>
                          <TableCell>{op.description || '-'}</TableCell>
                          <TableCell align="center">
                            <IconButton color="primary" onClick={() => handleOpenEditStd(op)} size="small">
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
        </Stack>
      ) : (
        // === Tab 2 content ===
        <Stack spacing={2}>
          <Card variant="outlined" sx={{ p: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Chọn sản phẩm thiết lập quy trình"
                  value={selectedProductId}
                  onChange={handleProductChange}
                >
                  <MenuItem value="">-- Vui lòng chọn sản phẩm --</MenuItem>
                  {products.map((prod) => (
                    <MenuItem key={prod.id} value={prod.id}>
                      {prod.productName} ({prod.productCode})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  disabled={!selectedProductId}
                  onClick={handleOpenCreateFlow}
                >
                  Thêm công đoạn quy trình
                </Button>
              </Grid>
            </Grid>
          </Card>

          {selectedProductId === '' ? (
            <Alert severity="info">Vui lòng chọn một sản phẩm ở bộ lọc trên để xem quy trình sản xuất.</Alert>
          ) : loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Thứ tự (Seq)</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Mã công đoạn</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Tên công đoạn</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Định mức (Giây)</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Tay nghề yêu cầu</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {productOps.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        Sản phẩm này chưa được thiết lập quy trình công đoạn
                      </TableCell>
                    </TableRow>
                  ) : (
                    productOps.map((op) => {
                      const skillInfo = skillLevels.find((s) => s.value === op.requiredSkillLevel)?.label.split(' ')[0] || op.requiredSkillLevel;
                      return (
                        <TableRow key={op.id} hover>
                          <TableCell align="center" sx={{ fontWeight: 700, color: 'primary.main' }}>
                            {op.sequenceNumber}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{op.operationCode}</TableCell>
                          <TableCell>{op.operationName}</TableCell>
                          <TableCell align="right">{op.standardTimeSeconds}</TableCell>
                          <TableCell>{skillInfo}</TableCell>
                          <TableCell align="center">
                            <Stack direction="row" spacing={1} justifyContent="center">
                              <IconButton color="primary" onClick={() => handleOpenEditFlow(op)} size="small">
                                <Edit fontSize="small" />
                              </IconButton>
                              <IconButton color="error" onClick={() => handleDeleteFlow(op.id)} size="small">
                                <Delete fontSize="small" />
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
        </Stack>
      )}

      {/* Dialog Standard Op Create/Edit */}
      <Dialog open={stdDialogOpen} onClose={() => !submitLoading && setStdDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {stdDialogMode === 'create' ? 'Tạo công đoạn chuẩn' : 'Cập nhật công đoạn chuẩn'}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Mã công đoạn"
              disabled={stdDialogMode === 'edit'}
              value={stdForm.operationCode}
              onChange={(e) => setStdForm({ ...stdForm, operationCode: e.target.value })}
              error={!!stdErrors.operationCode}
              helperText={stdErrors.operationCode}
            />
            <TextField
              fullWidth
              label="Tên công đoạn"
              value={stdForm.operationName}
              onChange={(e) => setStdForm({ ...stdForm, operationName: e.target.value })}
              error={!!stdErrors.operationName}
              helperText={stdErrors.operationName}
            />
            <TextField
              fullWidth
              type="number"
              label="Định mức thời gian (Giây)"
              value={stdForm.standardTimeSeconds}
              onChange={(e) => setStdForm({ ...stdForm, standardTimeSeconds: Number(e.target.value) })}
              error={!!stdErrors.standardTimeSeconds}
              helperText={stdErrors.standardTimeSeconds}
            />
            <TextField
              select
              fullWidth
              label="Mức độ khó"
              value={stdForm.difficultyLevel}
              onChange={(e) => setStdForm({ ...stdForm, difficultyLevel: e.target.value })}
            >
              {difficulties.map((d) => (
                <MenuItem key={d.value} value={d.value}>
                  {d.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Mô tả kỹ thuật"
              value={stdForm.description}
              onChange={(e) => setStdForm({ ...stdForm, description: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStdDialogOpen(false)} disabled={submitLoading}>
            Hủy bỏ
          </Button>
          <Button onClick={handleSaveStd} variant="contained" disabled={submitLoading}>
            {submitLoading ? 'Đang lưu...' : 'Lưu lại'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Product Flow Create/Edit */}
      <Dialog open={flowDialogOpen} onClose={() => !submitLoading && setFlowDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {flowDialogMode === 'create' ? 'Thêm công đoạn quy trình' : 'Cập nhật công đoạn quy trình'}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              fullWidth
              label="Chọn công đoạn chuẩn"
              disabled={flowDialogMode === 'edit'}
              value={flowForm.operationId}
              onChange={(e) => setFlowForm({ ...flowForm, operationId: e.target.value })}
              error={!!flowErrors.operationId}
              helperText={flowErrors.operationId}
            >
              <MenuItem value="">-- Chọn công đoạn --</MenuItem>
              {stdOps.map((op) => (
                <MenuItem key={op.id} value={op.id}>
                  {op.operationName} ({op.operationCode})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              type="number"
              label="Thứ tự lắp ráp (Sequence)"
              value={flowForm.sequenceNumber}
              onChange={(e) => setFlowForm({ ...flowForm, sequenceNumber: Number(e.target.value) })}
              error={!!flowErrors.sequenceNumber}
              helperText={flowErrors.sequenceNumber}
            />
            <TextField
              fullWidth
              type="number"
              label="Thời gian định mức sản phẩm này (Giây)"
              value={flowForm.standardTimeSeconds}
              onChange={(e) => setFlowForm({ ...flowForm, standardTimeSeconds: Number(e.target.value) })}
              error={!!flowErrors.standardTimeSeconds}
              helperText={flowErrors.standardTimeSeconds}
            />
            <TextField
              select
              fullWidth
              label="Yêu cầu trình độ thợ"
              value={flowForm.requiredSkillLevel}
              onChange={(e) => setFlowForm({ ...flowForm, requiredSkillLevel: e.target.value })}
            >
              {skillLevels.map((sl) => (
                <MenuItem key={sl.value} value={sl.value}>
                  {sl.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFlowDialogOpen(false)} disabled={submitLoading}>
            Hủy bỏ
          </Button>
          <Button onClick={handleSaveFlow} variant="contained" disabled={submitLoading}>
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
