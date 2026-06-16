import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { Add, Visibility } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { productionOutputService } from '../services/productionOutputService.js';

export function ProductionOutputsPage() {
  const [outputs, setOutputs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Detail dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedOutput, setSelectedOutput] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadOutputs = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await productionOutputService.list();
      setOutputs(response.data);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Không tải được báo cáo sản lượng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOutputs();
  }, []);

  const handleOpenDetail = async (output) => {
    setSelectedOutput(output);
    setOpenDialog(true);
    setDetailLoading(true);
    try {
      const response = await productionOutputService.getById(output.id);
      setSelectedOutput(response.data);
    } catch {
      showSnackbar('Không tải được chi tiết báo cáo nhân sự');
    } finally {
      setDetailLoading(false);
    }
  };

  const showSnackbar = (message) => {
    console.error(message);
  };

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Báo cáo sản lượng sản xuất
          </Typography>
          <Typography color="text.secondary">
            Bảng kê khai sản lượng hoàn thành tốt, sản phẩm lỗi hỏng, thời gian dừng chuyền và năng suất thợ.
          </Typography>
        </Box>
        <Button
          variant="contained"
          component={Link}
          to="/production-outputs/new"
          startIcon={<Add />}
          sx={{ borderRadius: '8px', bgcolor: '#176b5b', '&:hover': { bgcolor: '#0f5245' } }}
        >
          Báo cáo sản lượng ca
        </Button>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
      ) : outputs.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
          Chưa có báo cáo sản lượng nào được nộp.
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead sx={{ bgcolor: '#f5f7f6' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Ngày báo cáo</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Chuyền</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Ca</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Lệnh sản xuất</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Sản phẩm đạt</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Lỗi / Sửa lại</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Thời gian dừng (phút)</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {outputs.map((out) => (
                <TableRow key={out.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{out.outputDate}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{out.lineName}</TableCell>
                  <TableCell>{out.shiftName}</TableCell>
                  <TableCell sx={{ color: '#176b5b', fontWeight: 600 }}>{out.productionOrderCode}</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'success.main' }}>{out.goodQuantity} cái</TableCell>
                  <TableCell sx={{ color: out.defectQuantity > 0 ? 'error.main' : 'inherit' }}>
                    {out.defectQuantity} / {out.reworkQuantity ?? 0}
                  </TableCell>
                  <TableCell>{out.downtimeMinutes} phút</TableCell>
                  <TableCell align="right">
                    <IconButton color="info" onClick={() => handleOpenDetail(out)} title="Xem chi tiết năng suất thợ">
                      <Visibility />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Detail Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Chi tiết báo cáo sản lượng ca ngày {selectedOutput?.outputDate}
        </DialogTitle>
        <DialogContent dividers>
          {detailLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress size={24} /></Box>
          ) : !selectedOutput?.employeeOutputs || selectedOutput.employeeOutputs.length === 0 ? (
            <Typography>Không có báo cáo chi tiết năng suất công nhân.</Typography>
          ) : (
            <Stack spacing={2}>
              <Box sx={{ p: 2, bgcolor: '#f8faf9', borderRadius: '8px' }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Lệnh sản xuất</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedOutput?.productionOrderCode}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Chuyền may</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedOutput?.lineName}</Typography>
                  </Grid>
                </Grid>
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Chi tiết sản lượng theo nhân sự</Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f5f7f6' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Thợ may</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Công đoạn ráp</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>May đạt</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>May lỗi</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Thời gian (phút)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedOutput.employeeOutputs.map((eo) => (
                      <TableRow key={eo.id}>
                        <TableCell sx={{ fontWeight: 500 }}>{eo.fullName} ({eo.employeeCode})</TableCell>
                        <TableCell sx={{ color: '#176b5b', fontWeight: 600 }}>{eo.operationName}</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: 'success.main' }}>{eo.goodQuantity} cái</TableCell>
                        <TableCell sx={{ color: eo.defectQuantity > 0 ? 'error.main' : 'inherit' }}>{eo.defectQuantity} cái</TableCell>
                        <TableCell>{eo.workingMinutes} phút</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

// grid helper
function Grid({ children, ...props }) {
  return <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(12, 1fr)' }, gap: 2 }} {...props}>{children}</Box>;
}
