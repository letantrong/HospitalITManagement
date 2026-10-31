import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Typography,
  Divider,
} from '@mui/material';
import Grid from '../../components/common/AppGrid';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import {
  departmentService,
  categoryService,
  locationService,
  deviceService,
} from '../../services/dataStorageService';
import { logActivity } from '../../services/activityLogService';
import type { Device, Department, DeviceCategory, Location } from '../../types';

interface DeviceFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialDevice?: Device | null;
}

export const DeviceFormDialog: React.FC<DeviceFormDialogProps> = ({
  open,
  onClose,
  onSaved,
  initialDevice,
}) => {
  const { userProfile, isAdmin } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<DeviceCategory[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  // Form states
  const [deviceCode, setDeviceCode] = useState('');
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [cpu, setCpu] = useState('');
  const [ram, setRam] = useState('');
  const [storage, setStorage] = useState('');
  const [os, setOs] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [macAddress, setMacAddress] = useState('');
  const [others, setOthers] = useState('');
  const [originalCost, setOriginalCost] = useState<number>(0);
  const [depreciationRate, setDepreciationRate] = useState<number>(20);
  const [purchaseDate, setPurchaseDate] = useState('');
  const [warrantyExpiryDate, setWarrantyExpiryDate] = useState('');
  const [assignedUserName, setAssignedUserName] = useState('');
  const [assignedUserPosition, setAssignedUserPosition] = useState('');
  const [assignedUserPhone, setAssignedUserPhone] = useState('');
  const [status, setStatus] = useState<any>('InUse');
  const [condition, setCondition] = useState<any>('Good');

  useEffect(() => {
    const fetchSelectOptions = async () => {
      const [deptList, catList, locList] = await Promise.all([
        departmentService.getAll(),
        categoryService.getAll(),
        locationService.getAll(),
      ]);

      // Nếu là Manager thì chỉ được chọn khoa phòng trong phạm vi quản lý
      const allowedDepts = isAdmin
        ? deptList
        : deptList.filter((d) => userProfile?.departmentIds?.includes(d.id));

      setDepartments(allowedDepts);
      setCategories(catList);
      setLocations(locList);

      if (!initialDevice && allowedDepts.length > 0) {
        setDepartmentId(allowedDepts[0].id);
      }
    };

    if (open) {
      fetchSelectOptions();
    }
  }, [open, isAdmin, userProfile, initialDevice]);

  // Load initial data khi sửa
  useEffect(() => {
    if (initialDevice) {
      setDeviceCode(initialDevice.deviceCode);
      setName(initialDevice.name);
      setCategoryId(initialDevice.categoryId);
      setDepartmentId(initialDevice.departmentId);
      setLocationId(initialDevice.locationId);
      setManufacturer(initialDevice.manufacturer);
      setModel(initialDevice.model);
      setSerialNumber(initialDevice.serialNumber);
      setCpu(initialDevice.specifications?.cpu || '');
      setRam(initialDevice.specifications?.ram || '');
      setStorage(initialDevice.specifications?.storage || '');
      setOs(initialDevice.specifications?.os || '');
      setIpAddress(initialDevice.specifications?.ipAddress || '');
      setMacAddress(initialDevice.specifications?.macAddress || '');
      setOthers(initialDevice.specifications?.others || '');
      setOriginalCost(initialDevice.originalCost || 0);
      setDepreciationRate(initialDevice.depreciationRate || 20);
      setPurchaseDate(initialDevice.purchaseDate || '');
      setWarrantyExpiryDate(initialDevice.warrantyExpiryDate || '');
      setAssignedUserName(initialDevice.assignedUser?.name || '');
      setAssignedUserPosition(initialDevice.assignedUser?.position || '');
      setAssignedUserPhone(initialDevice.assignedUser?.phone || '');
      setStatus(initialDevice.status);
      setCondition(initialDevice.condition);
    } else {
      // Tự động sinh mã thiết bị gợi ý
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      setDeviceCode(`BVPHCN-TB-2026-${randomSuffix}`);
      setName('');
      setCategoryId('');
      setLocationId('');
      setManufacturer('');
      setModel('');
      setSerialNumber('');
      setCpu('');
      setRam('');
      setStorage('');
      setOs('');
      setIpAddress('');
      setMacAddress('');
      setOthers('');
      setOriginalCost(15000000);
      setDepreciationRate(20);
      setPurchaseDate(new Date().toISOString().split('T')[0]);
      setWarrantyExpiryDate('');
      setAssignedUserName('');
      setAssignedUserPosition('');
      setAssignedUserPhone('');
      setStatus('InUse');
      setCondition('Good');
    }
  }, [initialDevice, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !deviceCode || !departmentId || !categoryId) {
      showError('Vui lòng điền các trường bắt buộc (Tên, Mã, Khoa phòng, Danh mục).');
      return;
    }

    const deptObj = departments.find((d) => d.id === departmentId);
    const catObj = categories.find((c) => c.id === categoryId);
    const locObj = locations.find((l) => l.id === locationId);

    const payload = {
      deviceCode,
      name,
      categoryId,
      categoryName: catObj?.name || 'Khác',
      departmentId,
      departmentName: deptObj?.name || 'Khoa chung',
      locationId: locationId || '',
      locationName: locObj?.name || '',
      manufacturer,
      model,
      serialNumber,
      specifications: {
        cpu,
        ram,
        storage,
        os,
        ipAddress,
        macAddress,
        others,
      },
      status,
      condition,
      originalCost: Number(originalCost),
      depreciationRate: Number(depreciationRate),
      purchaseDate,
      warrantyExpiryDate,
      assignedUser: assignedUserName
        ? {
            name: assignedUserName,
            position: assignedUserPosition,
            phone: assignedUserPhone,
          }
        : undefined,
      imageUrls: initialDevice?.imageUrls || [],
      documents: initialDevice?.documents || [],
      createdBy: userProfile?.id,
    };

    try {
      if (initialDevice) {
        await deviceService.update(initialDevice.id, payload);
        await logActivity(
          userProfile,
          'UPDATE_DEVICE',
          'DEVICE',
          `Cập nhật thông tin thiết bị: ${deviceCode} (${name})`,
          initialDevice.id,
          deviceCode
        );
        showSuccess('Cập nhật thiết bị thành công!');
      } else {
        const created = await deviceService.create(payload);
        await logActivity(
          userProfile,
          'CREATE_DEVICE',
          'DEVICE',
          `Tạo mới thiết bị CNTT: ${deviceCode} (${name}) cho ${deptObj?.name}`,
          created.id,
          deviceCode
        );
        showSuccess('Thêm thiết bị mới thành công!');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      console.error(err);
      showError(err.message || 'Lỗi lưu thiết bị.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 800, color: '#0284c7', borderBottom: '1px solid #e2e8f0' }}>
          {initialDevice ? `CHỈNH SỬA THIẾT BỊ: ${initialDevice.deviceCode}` : 'THÊM MỚI THIẾT BỊ CÔNG NGHỆ THÔNG TIN'}
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', mb: 1.5 }}>
            1. Thông tin Định danh & Quản lý
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Mã quản lý thiết bị *"
                size="small"
                fullWidth
                value={deviceCode}
                onChange={(e) => setDeviceCode(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField
                label="Tên thiết bị *"
                size="small"
                fullWidth
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Máy vi tính để bàn HP ProDesk 400 G7"
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                label="Danh mục loại thiết bị *"
                size="small"
                fullWidth
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
              >
                {categories.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                label="Khoa / Phòng ban quản lý *"
                size="small"
                fullWidth
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                required
              >
                {departments.map((d) => (
                  <MenuItem key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                label="Vị trí lắp đặt cụ thể"
                size="small"
                fullWidth
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
              >
                <MenuItem value="">-- Chọn vị trí --</MenuItem>
                {locations
                  .filter((l) => !departmentId || l.departmentId === departmentId)
                  .map((l) => (
                    <MenuItem key={l.id} value={l.id}>
                      {l.name} ({l.building} - {l.floor})
                    </MenuItem>
                  ))}
              </TextField>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', mb: 1.5 }}>
            2. Thông số Kỹ thuật & Nhà sản xuất
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Hãng sản xuất"
                size="small"
                fullWidth
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="HP, Dell, Canon, Cisco..."
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Model sản phẩm"
                size="small"
                fullWidth
                value={model}
                onChange={(e) => setModel(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Số Serial máy"
                size="small"
                fullWidth
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Bộ vi xử lý (CPU)"
                size="small"
                fullWidth
                value={cpu}
                onChange={(e) => setCpu(e.target.value)}
                placeholder="Intel Core i5 / Xeon..."
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Bộ nhớ trong (RAM)"
                size="small"
                fullWidth
                value={ram}
                onChange={(e) => setRam(e.target.value)}
                placeholder="16GB DDR4"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Ổ cứng lưu trữ"
                size="small"
                fullWidth
                value={storage}
                onChange={(e) => setStorage(e.target.value)}
                placeholder="SSD 512GB NVMe"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Hệ điều hành"
                size="small"
                fullWidth
                value={os}
                onChange={(e) => setOs(e.target.value)}
                placeholder="Windows 11 Pro"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Địa chỉ IP tĩnh"
                size="small"
                fullWidth
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                placeholder="192.168.10.x"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Địa chỉ MAC"
                size="small"
                fullWidth
                value={macAddress}
                onChange={(e) => setMacAddress(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Ghi chú cấu hình khác"
                size="small"
                fullWidth
                value={others}
                onChange={(e) => setOthers(e.target.value)}
                placeholder="Màn hình đi kèm, cổng kết nối, linh kiện phụ trợ y tế..."
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', mb: 1.5 }}>
            3. Trạng thái, Nguyên giá & Cán bộ Sử dụng
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}>
              <TextField
                select
                label="Trạng thái vòng đời"
                size="small"
                fullWidth
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <MenuItem value="InUse">Đang sử dụng</MenuItem>
                <MenuItem value="Storage">Trong kho</MenuItem>
                <MenuItem value="UnderMaintenance">Đang bảo trì</MenuItem>
                <MenuItem value="Broken">Bị hỏng</MenuItem>
                <MenuItem value="Disposed">Đã thanh lý</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                select
                label="Tình trạng hoạt động"
                size="small"
                fullWidth
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
              >
                <MenuItem value="Good">Tốt (100%)</MenuItem>
                <MenuItem value="Fair">Bình thường</MenuItem>
                <MenuItem value="Poor">Kém / Cần bảo dưỡng</MenuItem>
                <MenuItem value="Unusable">Không sử dụng được</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label="Nguyên giá (VNĐ)"
                type="number"
                size="small"
                fullWidth
                value={originalCost}
                onChange={(e) => setOriginalCost(Number(e.target.value))}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label="Tỷ lệ khấu hao (%/năm)"
                type="number"
                size="small"
                fullWidth
                value={depreciationRate}
                onChange={(e) => setDepreciationRate(Number(e.target.value))}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label="Ngày đưa vào sử dụng"
                type="date"
                size="small"
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label="Ngày hết hạn bảo hành"
                type="date"
                size="small"
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
                value={warrantyExpiryDate}
                onChange={(e) => setWarrantyExpiryDate(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label="Cán bộ trực tiếp sử dụng"
                size="small"
                fullWidth
                value={assignedUserName}
                onChange={(e) => setAssignedUserName(e.target.value)}
                placeholder="Họ và tên cán bộ"
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label="Chức danh / Số điện thoại"
                size="small"
                fullWidth
                value={assignedUserPosition}
                onChange={(e) => setAssignedUserPosition(e.target.value)}
                placeholder="Điều dưỡng / Bác sĩ"
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, borderTop: '1px solid #e2e8f0' }}>
          <Button onClick={onClose} color="inherit">
            Hủy bỏ
          </Button>
          <Button type="submit" variant="contained" color="primary" sx={{ fontWeight: 700 }}>
            {initialDevice ? 'LƯU THAY ĐỔI' : 'LƯU THIẾT BỊ MỚI'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
