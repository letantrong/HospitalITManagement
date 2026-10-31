import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import HistoryIcon from '@mui/icons-material/History';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ipAssignmentService } from '../../services/dataStorageService';
import { IpAssignmentHistory } from '../../types';

export const IpHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile, isAdmin } = useAuth();

  const [loading, setLoading] = useState(true);
  const [historyList, setHistoryList] = useState<IpAssignmentHistory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('ALL');

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    loadHistory();
  }, [userProfile]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await ipAssignmentService.getAllHistory(userProfile);
      setHistoryList(data);
    } catch (err) {
      console.error('Lỗi tải lịch sử IP:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter
  const filteredList = historyList.filter((item) => {
    if (filterAction !== 'ALL' && item.action !== filterAction) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchIp = item.ipAddress.toLowerCase().includes(term);
      const matchCode = item.deviceCode?.toLowerCase().includes(term);
      const matchName = item.deviceName?.toLowerCase().includes(term);
      const matchDept = item.departmentName?.toLowerCase().includes(term);
      const matchReason = item.reason?.toLowerCase().includes(term);
      return matchIp || matchCode || matchName || matchDept || matchReason;
    }
    return true;
  });

  const exportCsv = () => {
    const headers = [
      'ID Lịch sử',
      'Địa chỉ IP',
      'Mã thiết bị',
      'Tên thiết bị',
      'Khoa/Phòng',
      'Hành động',
      'Người thực hiện',
      'Thời gian',
      'Lý do',
      'Trạng thái',
    ];
    const rows = filteredList.map((h) => [
      h.id,
      h.ipAddress,
      h.deviceCode || '',
      h.deviceName || '',
      h.departmentName || '',
      h.action,
      h.assignedByName || h.releasedByName || '',
      h.assignedAt ? new Date(h.assignedAt).toLocaleString('vi-VN') : '',
      h.reason || '',
      h.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `lich_su_cap_phat_ip_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box sx={{ pb: 6 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon color="primary" /> Nhật Ký Lịch Sử Cấp Phát IP
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Theo dõi toàn bộ lịch sử gán, thu hồi và luân chuyển địa chỉ IP tĩnh trong bệnh viện
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={loadHistory} title="Làm mới">
            <RefreshIcon />
          </IconButton>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={exportCsv}
            disabled={filteredList.length === 0}
          >
            Xuất CSV
          </Button>
          {isAdmin && (
            <Button
              variant="contained"
              onClick={() => navigate('/ipam/assignment')}
            >
              Cấp phát IP mới
            </Button>
          )}
        </Box>
      </Box>

      {/* Filter toolbar */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Tìm theo IP, Mã máy, Tên thiết bị, Khoa phòng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ minWidth: 320, flexGrow: 1 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              },
            }}
          />

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="action-filter-label">Hành động</InputLabel>
            <Select
              labelId="action-filter-label"
              value={filterAction}
              label="Hành động"
              onChange={(e) => setFilterAction(e.target.value)}
            >
              <MenuItem value="ALL">Tất cả hành động</MenuItem>
              <MenuItem value="ASSIGN">Cấp phát (ASSIGN)</MenuItem>
              <MenuItem value="RELEASE">Thu hồi (RELEASE)</MenuItem>
              <MenuItem value="CHANGE">Thay đổi (CHANGE)</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Data Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table sx={{ minWidth: 900 }}>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Địa chỉ IP</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Mã & Tên Thiết Bị</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Khoa / Phòng ban</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Hành động</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Người thực hiện</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Thời điểm</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Lý do ghi nhận</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 6, color: '#94a3b8' }}>
                  Không có bản ghi lịch sử cấp phát IP nào phù hợp.
                </TableCell>
              </TableRow>
            ) : (
              filteredList
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>
                      <Typography sx={{ fontWeight: 700, fontFamily: 'monospace', color: '#0284c7' }}>
                        {row.ipAddress}
                      </Typography>
                      {row.vlanId && (
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          VLAN {row.vlanId}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {row.deviceCode ? (
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {row.deviceCode}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {row.deviceName}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          ---
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{row.departmentName || '---'}</TableCell>
                    <TableCell>
                      {row.action === 'ASSIGN' && (
                        <Chip label="Cấp phát" size="small" color="primary" variant="outlined" />
                      )}
                      {row.action === 'RELEASE' && (
                        <Chip label="Thu hồi" size="small" color="warning" variant="outlined" />
                      )}
                      {row.action === 'CHANGE' && (
                        <Chip label="Đổi IP" size="small" color="secondary" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {row.assignedByName || row.releasedByName || 'Hệ thống'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ display: 'block' }}>
                        {row.assignedAt
                          ? new Date(row.assignedAt).toLocaleString('vi-VN')
                          : row.releasedAt
                          ? new Date(row.releasedAt).toLocaleString('vi-VN')
                          : '---'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 220 }}>
                      <Typography variant="body2" noWrap title={row.reason}>
                        {row.reason || '---'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {row.status === 'Active' ? (
                        <Chip label="Đang gán" size="small" sx={{ bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 600 }} />
                      ) : (
                        <Chip label="Đã thu hồi" size="small" sx={{ bgcolor: '#f1f5f9', color: '#64748b' }} />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {row.deviceId && (
                        <Tooltip title="Xem chi tiết thiết bị">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/devices/${row.deviceId}`)}
                          >
                            <ArrowForwardIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={filteredList.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Số hàng:"
        />
      </TableContainer>
    </Box>
  );
};
