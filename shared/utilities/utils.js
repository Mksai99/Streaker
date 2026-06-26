import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTime(date) {
  return `${formatDate(date)} ${formatTime(date)}`;
}

export function getStreakEmoji(streak) {
  if (streak >= 100) return '💎';
  if (streak >= 50) return '🏆';
  if (streak >= 30) return '⭐';
  if (streak >= 14) return '🔥';
  if (streak >= 7) return '✨';
  if (streak >= 3) return '🌟';
  return '💫';
}

export function getLoyaltyColor(level) {
  const colors = {
    bronze: 'from-amber-600 to-amber-800',
    silver: 'from-gray-400 to-gray-600',
    gold: 'from-yellow-400 to-yellow-600',
    platinum: 'from-cyan-400 to-cyan-600',
    diamond: 'from-violet-400 to-violet-600',
  };
  return colors[level] || colors.bronze;
}

export function getLoyaltyBadge(level) {
  const badges = { bronze: '🥉', silver: '🥈', gold: '🥇', platinum: '💠', diamond: '💎' };
  return badges[level] || '🥉';
}

export function getRewardTypeLabel(type) {
  const labels = {
    percentage_discount: 'Percentage Off',
    fixed_discount: 'Fixed Discount',
    cashback: 'Cashback',
    free_product: 'Free Item',
  };
  return labels[type] || type;
}

export function truncate(str, length = 50) {
  if (!str) return '';
  return str.length > length ? str.substring(0, length) + '...' : str;
}
