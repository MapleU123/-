/**
 * A-Share Market Real-Time Date & Time Utilities
 * Provides dynamic trading calendar, current timestamp formatting,
 * and eliminates hardcoded static dates like 2026-09-01.
 */

// Helper to get Date in Beijing / China Standard Time (UTC+8)
export function getBeijingNow(): Date {
  const now = new Date();
  // Get UTC time in ms
  const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
  // Beijing is UTC+8
  return new Date(utcMs + (8 * 3600000));
}

/**
 * Returns current real-time date string: 'YYYY-MM-DD'
 */
export function getRealtimeDateString(): string {
  const d = getBeijingNow();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Returns current real-time time string: 'HH:mm:ss'
 */
export function getRealtimeTimeString(): string {
  const d = getBeijingNow();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

/**
 * Returns full date time string: 'YYYY-MM-DD HH:mm:ss'
 */
export function getRealtimeFullDateTimeString(): string {
  return `${getRealtimeDateString()} ${getRealtimeTimeString()}`;
}

/**
 * Returns short date time string: 'MM-DD HH:mm:ss'
 */
export function getRealtimeShortDateTimeString(): string {
  const d = getBeijingNow();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${m}-${day} ${h}:${min}:${s}`;
}

export interface TradingDayOption {
  value: string; // 'YYYY-MM-DD'
  label: string; // '2026-09-05 实时（最新）' or '2026-09-04 (昨日)'
  isLive: boolean;
}

/**
 * Computes dynamic trading days options for the dropdown selector
 */
export function getDynamicTradingDays(count = 5): TradingDayOption[] {
  const options: TradingDayOption[] = [];
  const current = getBeijingNow();
  const todayStr = getRealtimeDateString();

  // First option is always real-time today
  options.push({
    value: todayStr,
    label: `${todayStr} (实时最新)`,
    isLive: true
  });

  // Calculate past trading days (skip weekends)
  let pastDate = new Date(current.getTime());
  let foundDays = 1;

  while (foundDays < count) {
    pastDate.setDate(pastDate.getDate() - 1);
    const dayOfWeek = pastDate.getDay();
    // 0 = Sunday, 6 = Saturday -> skip weekends for trading days
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      continue;
    }
    const y = pastDate.getFullYear();
    const m = String(pastDate.getMonth() + 1).padStart(2, '0');
    const d = String(pastDate.getDate()).padStart(2, '0');
    const val = `${y}-${m}-${d}`;
    
    let suffix = '';
    if (foundDays === 1) {
      suffix = ' (上个交易日)';
    } else if (foundDays === 2) {
      suffix = ' (前交易日)';
    } else {
      const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      suffix = ` (${weekdays[dayOfWeek]})`;
    }

    options.push({
      value: val,
      label: `${val}${suffix}`,
      isLive: false
    });
    foundDays++;
  }

  return options;
}
