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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { categoryService } from '../../services/dataStorageService';
import type { DeviceCategory } from '../../types';

export const CategoryPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [categories, setCategories] = useState<DeviceCategory[]>([]);
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [years, setYears] = useState<number>(5);
  const [description, setDescription] = useState('');

  const loadData = async () => {
    const list = await categoryService.getAll();
    setCategories(list);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name) {
      showError('Vui lòng nhập Mã và Tên danh mục.');
      return;
    }
    try {
      await categoryService.create({
        code,
        name,
        defaultDepreciationYears: Number(years),
        description,
      });
      showSuccess('Đã thêm loại thiết bị mới!');
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
            DANH MỤC PHÂN LOẠI THIẾT BỊ CNTT
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Tiêu chuẩn phân loại trang thiết bị và định mức khấu hao năm
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
            THÊM DANH MỤC MỚI
          </Button>
        )}
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, width: 100 }}>Mã loại</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Tên danh mục thiết bị</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Khấu hao tiêu chuẩn</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Mô tả sử dụng trong bệnh viện</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((cat) => (
              <TableRow key={cat.id} hover>
                <TableCell sx={{ fontWeight: 800, color: '#0284c7' }}>{cat.code}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{cat.name}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#059669' }}>
                  {cat.defaultDepreciationYears} năm
                </TableCell>
                <TableCell sx={{ color: '#64748b' }}>{cat.description || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSave}>
          <DialogTitle sx={{ fontWeight: 800, color: '#0284c7' }}>THÊM LOẠI THIẾT BỊ MỚI</DialogTitle>
          <DialogContent>
            <TextField
              label="Mã phân loại *"
              size="small"
              fullWidth
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="VD: PC, LAPTOP, SERVER, PRINTER..."
              sx={{ mb: 2, mt: 1 }}
              required
            />
            <TextField
              label="Tên danh mục *"
              size="small"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Máy quét mã vạch y tế"
              sx={{ mb: 2 }}
              required
            />
            <TextField
              label="Khấu hao tiêu chuẩn (số năm) *"
              type="number"
              size="small"
              fullWidth
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              sx={{ mb: 2 }}
              required
            />
            <TextField
              label="Mô tả phạm vi sử dụng"
              multiline
              rows={2}
              fullWidth
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpen(false)}>Hủy</Button>
            <Button type="submit" variant="contained" color="primary" sx={{ fontWeight: 700 }}>
              LƯU DANH MỤC
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
