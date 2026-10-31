import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Divider,
} from '@mui/material';
import Grid from '../../components/common/AppGrid';
import AddIcon from '@mui/icons-material/Add';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import * as XLSX from 'xlsx';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import {
  inventoryService,
  departmentService,
  locationService,
} from '../../services/dataStorageService';
import { logActivity } from '../../services/activityLogService';
import { formatDate } from '../../utils/formatters';
import type {
  InventorySession,
  InventoryItem,
  Department,
  Location,
} from '../../types';

export const InventoryPage: React.FC = () => {
  const { userProfile, isAdmin } = useAuth();
  const { showSuccess, showError, showWarning } = useNotification();

  const [sessions, setSessions] = useState<InventorySession[]>([]);
  const [selectedSession, setSelectedSession] = useState<InventorySession | null>(null);
  const [sessionItems, setSessionItems] = useState<InventoryItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog Tạo Đợt
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newScope, setNewScope] = useState<any>('HospitalWide');
  const [newTargetDepts, setNewTargetDepts] = useState<string[]>([]);
  const [newNotes, setNewNotes] = useState('');

  // Dialog Quét Kiểm Kê
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [scanCodeInput, setScanCodeInput] = useState('');
  const [actualDeptId, setActualDeptId] = useState('');
  const [actualLocId, setActualLocId] = useState('');
  const [actualCondition, setActualCondition] = useState<any>('Good');

  const loadData = async () => {
    setLoading(true);
    try {
      const [sessionList, deptList, locList] = await Promise.all([
        inventoryService.getSessions(),
        departmentService.getAll(),
        locationService.getAll(),
      ]);
      setSessions(sessionList);
      setDepartments(deptList);
      setLocations(locList);

      const active = sessionList.find((s) => s.status === 'Active') || sessionList[0] || null;
      setSelectedSession(active);

      if (active) {
        const items = await inventoryService.getItemsBySession(active.id);
        setSessionItems(items);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectSession = async (session: InventorySession) => {
    setSelectedSession(session);
    const items = await inventoryService.getItemsBySession(session.id);
    setSessionItems(items);
  };

  // Tạo đợt mới (Admin)
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) {
      showError('Vui lòng nhập tên đợt kiểm kê.');
      return;
    }
    try {
      const created = await inventoryService.createSession({
        title: newTitle,
        scope: newScope,
        targetDepartmentIds: newScope === 'HospitalWide' ? departments.map((d) => d.id) : newTargetDepts,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
        status: 'Active',
        notes: newNotes,
        createdBy: userProfile?.id || 'admin',
      });

      await logActivity(
        userProfile,
        'START_INVENTORY',
        'INVENTORY',
        `Khởi tạo đợt kiểm kê mới: ${newTitle}`,
        created.id
      );

      showSuccess('Khởi tạo đợt kiểm kê và Snapshot thiết bị thành công!');
      setCreateOpen(false);
      setNewTitle('');
      loadData();
    } catch (err: any) {
      showError(err.message || 'Lỗi tạo đợt kiểm kê.');
    }
  };

  // Mở modal quét kiểm kê
  const handleOpenScan = () => {
    if (!selectedSession) {
      showWarning('Vui lòng chọn đợt kiểm kê trước.');
      return;
    }
    setScanCodeInput('');
    setActualDeptId(userProfile?.departmentIds?.[0] || departments[0]?.id || '');
    setActualLocId('');
    setActualCondition('Good');
    setScanModalOpen(true);
  };

  // Thực hiện quét kiểm kê
  const handleSubmitScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanCodeInput.trim() || !selectedSession) return;

    const deptObj = departments.find((d) => d.id === actualDeptId);
    const locObj = locations.find((l) => l.id === actualLocId);

    try {
      const res = await inventoryService.recordScan(
        selectedSession.id,
        scanCodeInput.trim(),
        userProfile!,
        actualDeptId,
        deptObj?.name || 'Khoa hiện trường',
        actualLocId,
        locObj?.name || 'Vị trí hiện trường',
        actualCondition
      );

      if (res.success) {
        showSuccess(res.message);
        await logActivity(
          userProfile,
          'SCAN_INVENTORY',
          'INVENTORY',
          `Quét kiểm kê mã: ${scanCodeInput} tại ${deptObj?.name}`,
          selectedSession.id,
          scanCodeInput
        );
        setScanCodeInput('');
        // Reload items
        const updatedItems = await inventoryService.getItemsBySession(selectedSession.id);
        setSessionItems(updatedItems);
        // Reload sessions để cập nhật số liệu summary
        const updatedSessions = await inventoryService.getSessions();
        setSessions(updatedSessions);
        const updatedCurrent = updatedSessions.find((s) => s.id === selectedSession.id);
        if (updatedCurrent) setSelectedSession(updatedCurrent);
      } else {
        showError(res.message);
      }
    } catch (err: any) {
      showError(err.message || 'Lỗi khi ghi nhận kiểm kê.');
    }
  };

  // Xuất Biên bản kiểm kê Excel
  const handleExportInventoryExcel = () => {
    if (!selectedSession || sessionItems.length === 0) {
      showWarning('Không có dữ liệu để xuất Excel.');
      return;
    }

    const rows = sessionItems.map((item, index) => ({
      STT: index + 1,
      'Mã thiết bị': item.deviceCode,
      'Tên thiết bị': item.deviceName,
      'Khoa trên sổ sách': item.expectedDepartmentName,
      'Vị trí trên sổ sách': item.expectedLocationName,
      'Đã quét': item.isScanned ? 'Đã kiểm kê' : 'Chưa kiểm kê',
      'Khoa thực tế kiểm kê': item.actualDepartmentName || '-',
      'Vị trí thực tế': item.actualLocationName || '-',
      'Tình trạng ghi nhận': item.actualCondition || 'Tốt',
      'Kết quả đối soát':
        item.resultStatus === 'Matched'
          ? 'Khớp thông tin'
          : item.resultStatus === 'Misplaced'
          ? 'Sai vị trí/khoa'
          : item.resultStatus === 'Damaged'
          ? 'Hỏng hóc'
          : item.resultStatus === 'Surplus'
          ? 'Thừa ngoài sổ'
          : 'Chưa tìm thấy',
      'Người quét': item.scannedByName || '-',
      'Thời gian quét': formatDate(item.scannedAt, true),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'BienBanKiemKe');
    XLSX.writeFile(wb, `BienBanKiemKe_${selectedSession.id}_BVPHCN_DongThap.xlsx`);
    showSuccess('Đã xuất Biên bản kiểm kê Excel thành công!');
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
            KIỂM KÊ TRANG THIẾT BỊ CNTT BẰNG MÃ QR
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Cơ chế Snapshot đối soát tự động: Khớp vị trí, Sai vị trí, Hỏng hóc và Thất thoát
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleExportInventoryExcel}
            sx={{ fontWeight: 600 }}
          >
            Xuất Biên Bản Excel
          </Button>

          <Button
            variant="contained"
            color="secondary"
            startIcon={<QrCodeScannerIcon />}
            onClick={handleOpenScan}
            sx={{ fontWeight: 700 }}
          >
            QUÉT KIỂM KÊ HIỆN TRƯỜNG
          </Button>

          {isAdmin && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setCreateOpen(true)}
              sx={{ fontWeight: 700 }}
            >
              TẠO ĐỢT KIỂM KÊ (ADMIN)
            </Button>
          )}
        </Box>
      </Box>

      {/* Danh sách các phiên kiểm kê */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {sessions.map((sess) => {
          const isSelected = selectedSession?.id === sess.id;
          const progress = ((sess.summary.totalScanned || 0) / (sess.summary.totalExpected || 1)) * 100;

          return (
            <Grid item xs={12} sm={6} md={4} key={sess.id}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                  bgcolor: isSelected ? '#f0f9ff' : '#ffffff',
                  cursor: 'pointer',
                  '&:hover': { borderColor: '#38bdf8' },
                }}
                onClick={() => handleSelectSession(sess)}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Chip
                    label={sess.status === 'Active' ? 'Đang hoạt động' : 'Đã kết thúc'}
                    color={sess.status === 'Active' ? 'success' : 'default'}
                    size="small"
                  />
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    {formatDate(sess.startDate)} - {formatDate(sess.endDate)}
                  </Typography>
                </Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', mb: 1 }}>
                  {sess.title}
                </Typography>
                <LinearProgress variant="determinate" value={progress} sx={{ borderRadius: 1, mb: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
                  <span>Tiến độ: {Math.round(progress)}%</span>
                  <span>
                    Đã quét: {sess.summary.totalScanned} / {sess.summary.totalExpected}
                  </span>
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {/* Thẻ Thống kê chi tiết phiên được chọn */}
      {selectedSession && (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0284c7', mb: 2 }}>
              KẾT QUẢ ĐỐI SOÁT ĐỢT: {selectedSession.title}
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={6} sm={2.4}>
                <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center', borderColor: '#a7f3d0' }}>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#059669' }}>
                    {selectedSession.summary.totalMatched}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#047857' }}>
                    Khớp vị trí (100%)
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={6} sm={2.4}>
                <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center', borderColor: '#fde68a' }}>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#d97706' }}>
                    {selectedSession.summary.totalMisplaced}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#b45309' }}>
                    Sai vị trí / Sai khoa
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={6} sm={2.4}>
                <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center', borderColor: '#fecaca' }}>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#dc2626' }}>
                    {selectedSession.summary.totalDamaged}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#991b1b' }}>
                    Hỏng hóc phát hiện
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={6} sm={2.4}>
                <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center', borderColor: '#fed7aa' }}>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#ea580c' }}>
                    {selectedSession.summary.totalMissing}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#c2410c' }}>
                    Chưa quét / Thất thoát
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={6} sm={2.4}>
                <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center', borderColor: '#bfdbfe' }}>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#2563eb' }}>
                    {selectedSession.summary.totalSurplus}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#1d4ed8' }}>
                    Thừa ngoài sổ sách
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Bảng Chi tiết từng thiết bị trong đợt kiểm kê */}
      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, width: 50 }}>STT</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Mã thiết bị</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Tên thiết bị</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Khoa / Vị trí Sổ sách</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Khoa / Vị trí Thực tế</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Kết quả đối soát</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Cán bộ kiểm kê</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sessionItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4, color: '#64748b' }}>
                  Không có mục kiểm kê nào trong đợt này.
                </TableCell>
              </TableRow>
            ) : (
              sessionItems.map((item, idx) => {
                let badgeColor: any = 'default';
                let label = 'Chưa quét';

                switch (item.resultStatus) {
                  case 'Matched':
                    badgeColor = 'success';
                    label = 'Khớp đúng';
                    break;
                  case 'Misplaced':
                    badgeColor = 'warning';
                    label = 'Sai vị trí';
                    break;
                  case 'Damaged':
                    badgeColor = 'error';
                    label = 'Hỏng hóc';
                    break;
                  case 'Surplus':
                    badgeColor = 'info';
                    label = 'Thừa ngoài sổ';
                    break;
                  case 'Missing':
                    badgeColor = 'default';
                    label = 'Chưa tìm thấy';
                    break;
                }

                return (
                  <TableRow key={item.id} hover>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#0284c7' }}>{item.deviceCode}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{item.deviceName}</TableCell>
                    <TableCell>
                      {item.expectedDepartmentName} <br />
                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                        {item.expectedLocationName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {item.isScanned ? (
                        <>
                          {item.actualDepartmentName} <br />
                          <Typography variant="caption" sx={{ color: '#059669', fontWeight: 600 }}>
                            {item.actualLocationName}
                          </Typography>
                        </>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>Chưa ghi nhận</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip label={label} color={badgeColor} size="small" />
                    </TableCell>
                    <TableCell>
                      {item.scannedByName || '-'}
                      {item.scannedAt && (
                        <Typography variant="caption" sx={{ display: 'block', color: '#94a3b8' }}>
                          {formatDate(item.scannedAt, true)}
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog Tạo Đợt Kiểm kê Mới (Admin) */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleCreateSession}>
          <DialogTitle sx={{ fontWeight: 800, color: '#0284c7' }}>KHỞI TẠO ĐỢT KIỂM KÊ TÀI SẢN CNTT</DialogTitle>
          <DialogContent>
            <TextField
              label="Tên đợt kiểm kê *"
              size="small"
              fullWidth
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Ví dụ: Kiểm kê Định kỳ Tài sản CNTT Quý 2/2026"
              sx={{ mb: 2, mt: 1 }}
              required
            />

            <TextField
              select
              label="Phạm vi kiểm kê"
              size="small"
              fullWidth
              value={newScope}
              onChange={(e) => setNewScope(e.target.value)}
              sx={{ mb: 2 }}
            >
              <MenuItem value="HospitalWide">Toàn bệnh viện</MenuItem>
              <MenuItem value="DepartmentSpecific">Một số khoa phòng chỉ định</MenuItem>
            </TextField>

            <TextField
              label="Ghi chú đợt kiểm kê"
              multiline
              rows={3}
              fullWidth
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Quyết định thành lập đoàn kiểm kê, lưu ý bảo mật dữ liệu..."
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setCreateOpen(false)}>Hủy</Button>
            <Button type="submit" variant="contained" color="primary" sx={{ fontWeight: 700 }}>
              TẠO ĐỢT & TỰ ĐỘNG CHỤP SNAPSHOT
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Dialog Quét Kiểm Kê Hiện Trường */}
      <Dialog open={scanModalOpen} onClose={() => setScanModalOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmitScan}>
          <DialogTitle sx={{ fontWeight: 800, color: '#059669' }}>
            QUÉT KIỂM KÊ THIẾT BỊ HIỆN TRƯỜNG
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2, color: '#64748b' }}>
              Nhập mã thiết bị hoặc quét mã token từ tem dán QR trên thân máy
            </Typography>

            <TextField
              label="Mã thiết bị hoặc Token QR *"
              size="small"
              fullWidth
              value={scanCodeInput}
              onChange={(e) => setScanCodeInput(e.target.value)}
              placeholder="Ví dụ: BVPHCN-MT-2024-001 hoặc quét camera"
              sx={{ mb: 2 }}
              autoFocus
              required
            />

            <TextField
              select
              label="Khoa / Phòng ban thực tế đang đặt thiết bị *"
              size="small"
              fullWidth
              value={actualDeptId}
              onChange={(e) => setActualDeptId(e.target.value)}
              sx={{ mb: 2 }}
              required
            >
              {departments.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Vị trí phòng thực tế"
              size="small"
              fullWidth
              value={actualLocId}
              onChange={(e) => setActualLocId(e.target.value)}
              sx={{ mb: 2 }}
            >
              <MenuItem value="">-- Chưa xác định phòng --</MenuItem>
              {locations
                .filter((l) => !actualDeptId || l.departmentId === actualDeptId)
                .map((l) => (
                  <MenuItem key={l.id} value={l.id}>
                    {l.name}
                  </MenuItem>
                ))}
            </TextField>

            <TextField
              select
              label="Tình trạng kỹ thuật thực tế"
              size="small"
              fullWidth
              value={actualCondition}
              onChange={(e) => setActualCondition(e.target.value)}
            >
              <MenuItem value="Good">Tốt (Đang hoạt động ổn định)</MenuItem>
              <MenuItem value="Fair">Bình thường</MenuItem>
              <MenuItem value="Poor">Kém / Cần bảo dưỡng</MenuItem>
              <MenuItem value="Unusable">Hỏng / Không thể sử dụng</MenuItem>
            </TextField>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setScanModalOpen(false)}>Đóng</Button>
            <Button type="submit" variant="contained" color="secondary" sx={{ fontWeight: 700 }}>
              GHI NHẬN KIỂM KÊ
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
