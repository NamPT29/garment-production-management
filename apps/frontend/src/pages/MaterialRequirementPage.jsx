import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
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
import { ArrowBack, Send, Warning, KeyboardArrowDown, KeyboardArrowUp, CheckCircle } from '@mui/icons-material';
import { Link, useParams } from 'react-router-dom';
import { materialRequirementService } from '../services/materialRequirementService.js';

function RequirementRow({ row }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow hover>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell sx={{ fontWeight: 600, color: '#176b5b' }}>{row.materialCode}</TableCell>
        <TableCell sx={{ fontWeight: 500 }}>{row.materialName}</TableCell>
        <TableCell>{row.unit}</TableCell>
        <TableCell align="right" sx={{ fontWeight: 700 }}>
          {row.requiredQuantity.toLocaleString()}
        </TableCell>
        <TableCell align="right">{row.availableQuantity.toLocaleString()}</TableCell>
        <TableCell align="right" sx={{ fontWeight: 700, color: row.isShortage ? '#d32f2f' : 'inherit' }}>
          {row.shortageQuantity.toLocaleString()}
        </TableCell>
        <TableCell>
          {row.isShortage ? (
            <Chip
              icon={<Warning style={{ fontSize: 16 }} />}
              label="Thiếu vật tư"
              color="error"
              size="small"
            />
          ) : (
            <Chip
              icon={<CheckCircle style={{ fontSize: 16 }} />}
              label="Đủ tồn kho"
              color="success"
              size="small"
              variant="outlined"
            />
          )}
        </TableCell>
      </TableRow>
      
      {/* Collapse details */}
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700, color: '#176b5b' }}>
                Chi tiết tính toán định mức từ sản phẩm trong đơn:
              </Typography>
              <Table size="small" aria-label="purchases">
                <TableHead sx={{ bgcolor: '#f5f7f6' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Tên sản phẩm</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Mã sản phẩm</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Số lượng áo/quần đặt</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Định mức đơn vị</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Hao hụt (%)</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Nhu cầu dòng</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {row.bomDetails.map((detail, index) => (
                    <TableRow key={index}>
                      <TableCell>{detail.productName}</TableCell>
                      <TableCell>{detail.productCode}</TableCell>
                      <TableCell align="right">{detail.orderQuantity.toLocaleString()}</TableCell>
                      <TableCell align="right">{detail.quantityPerUnit}</TableCell>
                      <TableCell align="right">{detail.wasteRatePercent}%</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        {Number(detail.calculatedNeed.toFixed(4)).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export function MaterialRequirementPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRequirements = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await materialRequirementService.getRequirementsByOrderId(id);
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Không tính được nhu cầu nguyên phụ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequirements();
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Stack spacing={2}>
        <Button startIcon={<ArrowBack />} component={Link} to={`/orders/${id}`} sx={{ alignSelf: 'flex-start' }}>
          Quay lại đơn hàng
        </Button>
        <Alert severity="error">{error || 'Không tải được dữ liệu tính toán'}</Alert>
      </Stack>
    );
  }

  const hasShortages = data.requirements.some((req) => req.isShortage);

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Button startIcon={<ArrowBack />} component={Link} to={`/orders/${id}`} sx={{ mb: 2 }}>
            Quay lại chi tiết đơn hàng
          </Button>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Tính nhu cầu nguyên phụ liệu đơn hàng
          </Typography>
          <Typography color="text.secondary">
            Đơn hàng: {data.order.orderCode} | Khách hàng: {data.order.customerName}
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<Send />}
          component={Link}
          to={`/inventory/issues/new?orderId=${id}`}
          sx={{ borderRadius: '8px' }}
        >
          Lập phiếu xuất kho cho đơn này
        </Button>
      </Box>

      {/* Warnings Alerts */}
      {data.warnings && data.warnings.length > 0 ? (
        <Stack spacing={1}>
          {data.warnings.map((warn, i) => (
            <Alert key={i} severity="warning" icon={<Warning />}>
              {warn}
            </Alert>
          ))}
        </Stack>
      ) : null}

      {/* Shortage Summary Alert */}
      {hasShortages ? (
        <Alert severity="error">
          Có nguyên phụ liệu bị thiếu hụt so với tổng số lượng tồn thực tế trên tất cả các kho. Vui lòng kiểm tra nhập kho bổ sung trước khi lập phiếu xuất.
        </Alert>
      ) : (
        <Alert severity="success">
          Đủ hàng! Tất cả các nguyên phụ liệu của đơn hàng đều có đủ tồn kho khả dụng để thực hiện xuất kho.
        </Alert>
      )}

      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        Bảng đối chiếu nhu cầu vật tư dệt may
      </Typography>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead sx={{ bgcolor: '#f5f7f6' }}>
            <TableRow>
              <TableCell style={{ width: 50 }}></TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Mã nguyên phụ liệu</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Tên nguyên phụ liệu</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>ĐVT</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Nhu cầu sản xuất</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Tồn khả dụng (Tổng kho)</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Hụt thiếu</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.requirements.map((req) => (
              <RequirementRow key={req.materialId} row={req} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}
