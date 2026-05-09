/**
 * 格式化工具函数
 */

// 格式化日期时间
export function formatDateTime(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// 格式化日期
export function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

// 格式化金额
export function formatMoney(amount) {
  if (amount === null || amount === undefined) return '0.00';
  const num = Number(amount);
  if (isNaN(num)) return '0.00';
  return num.toFixed(2);
}

// 格式化手机号
export function formatPhone(phone) {
  if (!phone) return '-';
  // 如果是纯数字且长度为11位，格式化显示
  if (/^\d{11}$/.test(phone)) {
    return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1****$3');
  }
  return phone;
}

// 相对时间（如：刚刚、5分钟前）
export function formatRelativeTime(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';

  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;

  return formatDate(dateString);
}
