import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { locationService, departmentService } from '../../services/dataStorageService';
import type { Location, Department } from '../../types';

export const LocationPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [locations, setLocations] = useState<Location[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [open, setOpen] = useState(false);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [building, setBuilding] = useState('');
  const [floor, setFloor] = useState('');
  const [departmentId, setDepartmentId] = useState('');

  const loadData = async () => {
    const [locs, depts] = await Promise.all([
      locationService.getAll(),
      departmentService.getAll(),
    ]);
    setLocations(locs);
    setDepartments(depts);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name || !departmentId) {
      showError('Vui lòng điền đủ Mã, Tên phòng và Khoa quản lý.');
      return;
    }
    const deptObj = departments.find((d) => d.id === departmentId);
    try {
      await locationService.create({
        code,
        name,
        building: building || 'Khu A',
        floor: floor || 'Tầng 1',
        departmentId,
        departmentName: deptObj?.name || '',
      });
      showSuccess('Đã thêm vị trí phòng mới!');
      setOpen(false);
      setCode('');
      setName('');
      loadData();
    } catch (err: any) {
      showError(err.message || 'Lỗi khi lưu.');
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
            QUẢN LÝ VỊ TRÍ & PHÒNG LÀM VIỆC VẬT LÝ
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Danh mục Tòa nhà, Tầng và Phòng bố trí thiết bị CNTT
          </Typography>
        </Box>

        {isAdmin && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setOpen(true)}
            sx={{ fontWeight: 700 }}
          >
            THÊM VỊ TRÍ PHÒNG MỚI
          </Button>
        )}
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, width: 90 }}>Mã phòng</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Tên phòng / Khu vực</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Tòa nhà</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Tầng</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Thuộc Khoa / Phòng ban</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {locations.map((loc) => (
              <TableRow key={loc.id} hover>
                <TableCell sx={{ fontWeight: 700, color: '#0284c7' }}>{loc.code}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{loc.name}</TableCell>
                <TableCell>{loc.building}</TableCell>
                <TableCell>{loc.floor}</TableCell>
                <TableCell>{loc.departmentName}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSave}>
          <DialogTitle sx={{ fontWeight: 800, color: '#0284c7' }}>THÊM VỊ TRÍ / PHÒNG MỚI</DialogTitle>
          <DialogContent>
            <TextField
              label="Mã phòng *"
              size="small"
              fullWidth
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="VD: A101, B202, KHO-CNTT..."
              sx={{ mb: 2, mt: 1 }}
              required
            />
            <TextField
              label="Tên phòng / Khu vực *"
              size="small"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Phòng Tiếp nhận BHYT - Nhà A"
              sx={{ mb: 2 }}
              required
            />
            <TextField
              select
              label="Thuộc Khoa / Phòng ban *"
              size="small"
              fullWidth
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
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
              label="Tòa nhà"
              size="small"
              fullWidth
              value={building}
              onChange={(e) => setBuilding(e.target.value)}
              placeholder="Khu A, Khu B, Khu Khám bệnh..."
              sx={{ mb: 2 }}
            />
            <TextField
              label="Tầng"
              size="small"
              fullWidth
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              placeholder="Tầng 1, Tầng 2, Tầng trệt..."
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpen(false)}>Hủy</Button>
            <Button type="submit" variant="contained" color="primary" sx={{ fontWeight: 700 }}>
              LƯU VỊ TRÍ
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
