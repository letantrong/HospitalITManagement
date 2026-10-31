import type { IpAddressStatus } from '../types';

/**
 * TIỆN ÍCH TÍNH TOÁN & VALIDATION IP VÀ SUBNET (IPAM)
 * Bệnh viện Phục hồi chức năng Đồng Tháp
 */

// Chuyển đổi IPv4 string sang số nguyên 32-bit (unsigned)
export const ipToNumber = (ip: string): number => {
  const parts = ip.trim().split('.');
  if (parts.length !== 4) return 0;
  return (
    ((parseInt(parts[0], 10) << 24) >>> 0) +
    ((parseInt(parts[1], 10) << 16) >>> 0) +
    ((parseInt(parts[2], 10) << 8) >>> 0) +
    (parseInt(parts[3], 10) >>> 0)
  );
};

// Chuyển đổi số nguyên 32-bit sang IPv4 string
export const numberToIp = (num: number): string => {
  return [
    (num >>> 24) & 255,
    (num >>> 16) & 255,
    (num >>> 8) & 255,
    num & 255,
  ].join('.');
};

// Kiểm tra cú pháp địa chỉ IPv4 hợp lệ
export const isValidIpv4 = (ip: string): boolean => {
  if (!ip) return false;
  const parts = ip.trim().split('.');
  if (parts.length !== 4) return false;
  return parts.every((p) => {
    if (!/^\d+$/.test(p)) return false;
    const n = parseInt(p, 10);
    return n >= 0 && n <= 255 && (p === '0' || !p.startsWith('0'));
  });
};

// Chuyển CIDR (/24, /25...) sang Subnet Mask dạng dot-decimal
export const cidrToSubnetMask = (cidr: number): string => {
  if (cidr < 0 || cidr > 32) return '255.255.255.0';
  const mask = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
  return numberToIp(mask);
};

// Tính toán các thông số của một Dải mạng (Subnet calculation)
export interface SubnetDetails {
  networkAddress: string;
  broadcastAddress: string;
  subnetMask: string;
  firstUsableIp: string;
  lastUsableIp: string;
  totalHostCount: number; // Tổng số host khả dụng
}

export const calculateSubnetDetails = (
  networkAddress: string,
  cidr: number
): SubnetDetails | null => {
  if (!isValidIpv4(networkAddress) || cidr < 8 || cidr > 30) {
    return null;
  }

  const maskNum = (~0 << (32 - cidr)) >>> 0;
  const ipNum = ipToNumber(networkAddress);
  const networkNum = (ipNum & maskNum) >>> 0;
  const broadcastNum = (networkNum | ~maskNum) >>> 0;

  const firstUsableNum = networkNum + 1;
  const lastUsableNum = broadcastNum - 1;
  const totalHostCount = Math.max(0, lastUsableNum - firstUsableNum + 1);

  return {
    networkAddress: numberToIp(networkNum),
    broadcastAddress: numberToIp(broadcastNum),
    subnetMask: numberToIp(maskNum),
    firstUsableIp: numberToIp(firstUsableNum),
    lastUsableIp: numberToIp(lastUsableNum),
    totalHostCount,
  };
};

// Kiểm tra một IP có thuộc dải subnet này hay không
export const isIpInSubnet = (
  ip: string,
  networkAddress: string,
  cidr: number
): boolean => {
  if (!isValidIpv4(ip) || !isValidIpv4(networkAddress)) return false;
  const maskNum = (~0 << (32 - cidr)) >>> 0;
  return (ipToNumber(ip) & maskNum) === (ipToNumber(networkAddress) & maskNum);
};

// Kiểm tra xung đột / chồng lấn (overlap) giữa 2 dải mạng
export const isNetworkOverlapping = (
  netA: { networkAddress: string; cidr: number },
  netB: { networkAddress: string; cidr: number }
): boolean => {
  const detailsA = calculateSubnetDetails(netA.networkAddress, netA.cidr);
  const detailsB = calculateSubnetDetails(netB.networkAddress, netB.cidr);
  if (!detailsA || !detailsB) return false;

  const startA = ipToNumber(detailsA.networkAddress);
  const endA = ipToNumber(detailsA.broadcastAddress);

  const startB = ipToNumber(detailsB.networkAddress);
  const endB = ipToNumber(detailsB.broadcastAddress);

  // Giao nhau nếu startA <= endB && endA >= startB
  return startA <= endB && endA >= startB;
};

// Sinh danh sách địa chỉ IP hợp lệ cho dải mạng (loại trừ Network, Broadcast, Gateway, Exclusions)
export const generateUsableIps = (
  networkAddress: string,
  cidr: number,
  gateway: string,
  exclusions: string[] = []
): Array<{ ip: string; ipNumber: number }> => {
  const details = calculateSubnetDetails(networkAddress, cidr);
  if (!details) return [];

  const startNum = ipToNumber(details.firstUsableIp);
  const endNum = ipToNumber(details.lastUsableIp);
  const gatewayNum = ipToNumber(gateway);
  const exclusionNums = new Set(exclusions.map(ipToNumber));

  const result: Array<{ ip: string; ipNumber: number }> = [];

  for (let num = startNum; num <= endNum; num++) {
    if (num === gatewayNum || exclusionNums.has(num)) {
      continue;
    }
    result.push({
      ip: numberToIp(num),
      ipNumber: num,
    });
  }

  return result;
};

// Metadata trạng thái IP hiển thị trên giao diện
export const getIpStatusMeta = (
  status: IpAddressStatus
): { label: string; color: 'success' | 'warning' | 'info' | 'error'; hex: string } => {
  switch (status) {
    case 'Available':
      return { label: 'Còn trống (Available)', color: 'success', hex: '#10b981' };
    case 'Reserved':
      return { label: 'Giữ chỗ (Reserved)', color: 'warning', hex: '#f59e0b' };
    case 'Assigned':
      return { label: 'Đã cấp phát (Assigned)', color: 'info', hex: '#0284c7' };
    case 'Blocked':
      return { label: 'Đã khóa (Blocked)', color: 'error', hex: '#ef4444' };
    default:
      return { label: status, color: 'info', hex: '#64748b' };
  }
};
