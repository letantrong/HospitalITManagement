import {
  ipToNumber,
  numberToIp,
  isValidIpv4,
  cidrToSubnetMask,
  calculateSubnetDetails,
  isIpInSubnet,
  isNetworkOverlapping,
  generateUsableIps,
} from './frontend/src/utils/ipamUtils';

console.log('====================================================');
console.log('BỘ KIỂM THỬ TÍNH NĂNG VÀ THUẬT TOÁN IPAM (HOSPITAL IT)');
console.log('====================================================\n');

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`[FAIL] ${testName}`);
    failedTests++;
  }
}

// 1. Kiểm tra chuyển đổi IP và Số nguyên
const ip = '192.168.1.1';
const num = ipToNumber(ip);
assert(num === 3232235777, `1. ipToNumber(${ip}) = ${num}`);
assert(numberToIp(num) === ip, `2. numberToIp(${num}) = ${numberToIp(num)}`);

// 2. Kiểm tra tính hợp lệ IPv4
assert(isValidIpv4('192.168.1.1') === true, '3. Kiểm tra IPv4 hợp lệ: 192.168.1.1');
assert(isValidIpv4('10.20.0.254') === true, '4. Kiểm tra IPv4 hợp lệ: 10.20.0.254');
assert(isValidIpv4('256.1.1.1') === false, '5. Kiểm tra IPv4 không hợp lệ: 256.1.1.1');
assert(isValidIpv4('192.168.1') === false, '6. Kiểm tra IPv4 không đủ 4 octets: 192.168.1');

// 3. Kiểm tra Subnet Mask theo CIDR
assert(cidrToSubnetMask(24) === '255.255.255.0', '7. CIDR /24 -> Mask 255.255.255.0');
assert(cidrToSubnetMask(26) === '255.255.255.192', '8. CIDR /26 -> Mask 255.255.255.192');
assert(cidrToSubnetMask(16) === '255.255.0.0', '9. CIDR /16 -> Mask 255.255.0.0');

// 4. Kiểm tra tính toán Subnet (Network, Broadcast, Usable Range)
const subnet = calculateSubnetDetails('192.168.10.0', 24);
assert(subnet !== null, '10. Tính toán subnet 192.168.10.0/24 thành công');
if (subnet) {
  assert(subnet.networkAddress === '192.168.10.0', '11. Network Address: 192.168.10.0');
  assert(subnet.broadcastAddress === '192.168.10.255', '12. Broadcast Address: 192.168.10.255');
  assert(subnet.firstUsableIp === '192.168.10.1', '13. First Usable IP: 192.168.10.1');
  assert(subnet.lastUsableIp === '192.168.10.254', '14. Last Usable IP: 192.168.10.254');
  assert(subnet.totalHostCount === 254, '15. Tổng số IP khả dụng (totalHostCount): 254');
}

// 5. Kiểm tra IP thuộc Subnet
assert(isIpInSubnet('192.168.10.50', '192.168.10.0', 24) === true, '16. 192.168.10.50 thuộc 192.168.10.0/24');
assert(isIpInSubnet('192.168.11.1', '192.168.10.0', 24) === false, '17. 192.168.11.1 KHÔNG thuộc 192.168.10.0/24');

// 6. Kiểm tra phát hiện chồng lấn dải mạng (Network Overlap Check)
const netA = { networkAddress: '192.168.1.0', cidr: 24, vlanId: 10 };
const netB_overlap = { networkAddress: '192.168.1.128', cidr: 25, vlanId: 10 };
const netC_no_overlap = { networkAddress: '192.168.2.0', cidr: 24, vlanId: 10 };
assert(isNetworkOverlapping(netA, netB_overlap) === true, '18. Phát hiện chính xác dải mạng 192.168.1.128/25 bị chồng lấn vào 192.168.1.0/24');
assert(isNetworkOverlapping(netA, netC_no_overlap) === false, '19. Xác nhận 192.168.2.0/24 KHÔNG bị chồng lấn với 192.168.1.0/24');

// 7. Kiểm tra loại trừ Gateway và Network/Broadcast Address khi sinh IP
const usable = generateUsableIps('192.168.1.0', 29, '192.168.1.1', ['192.168.1.2']);
// Subnet /29 có 8 IP: .0 (Network), .1 (Gateway - loại trừ), .2 (Exclusion - loại trừ), .3, .4, .5, .6 (Usable), .7 (Broadcast - loại trừ)
assert(usable.length === 4, `20. Subnet /29 sau khi loại trừ Gateway (.1) và Exclusion (.2) còn đúng 4 IP (Thực tế: ${usable.length})`);
assert(usable.some(x => x.ip === '192.168.1.0') === false, '21. Network Address .0 KHÔNG có trong danh sách khả dụng');
assert(usable.some(x => x.ip === '192.168.1.1') === false, '22. Gateway .1 KHÔNG có trong danh sách khả dụng');
assert(usable.some(x => x.ip === '192.168.1.2') === false, '23. IP loại trừ .2 KHÔNG có trong danh sách khả dụng');
assert(usable.some(x => x.ip === '192.168.1.7') === false, '24. Broadcast Address .7 KHÔNG có trong danh sách khả dụng');

console.log('\n====================================================');
console.log(`KẾT QUẢ KIỂM THỬ: ${passedTests} PASSED / ${failedTests} FAILED`);
console.log('====================================================');
