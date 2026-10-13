/**
 * Utility to convert military 24-hour time to standard 12-hour Arabic time
 * Example: '14:00' -> '02:00 م', '08:30' -> '08:30 ص'
 */
export function formatTime12h(timeStr?: string): string {
  if (!timeStr) return '';
  if (timeStr.includes('ص') || timeStr.includes('م') || timeStr.includes('ظهراً') || timeStr.includes('صباحاً')) {
    return timeStr;
  }

  // Handle strings like "2026-10-12 14:00"
  if (timeStr.includes(' ')) {
    const [datePart, timePart] = timeStr.split(' ');
    if (timePart && timePart.includes(':')) {
      return `${datePart} ${formatTime12h(timePart)}`;
    }
  }

  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1].slice(0, 2).padStart(2, '0');
    if (isNaN(hours)) return timeStr;
    const period = hours >= 12 ? 'م' : 'ص';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    const hoursStr = hours < 10 ? `0${hours}` : `${hours}`;
    return `${hoursStr}:${minutes} ${period}`;
  }

  return timeStr;
}

export function getCurrentTime12h(): string {
  const now = new Date();
  const hours24 = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const period = hours24 >= 12 ? 'م' : 'ص';
  let hours12 = hours24 % 12;
  if (hours12 === 0) hours12 = 12;
  const hoursStr = hours12 < 10 ? `0${hours12}` : `${hours12}`;
  return `${hoursStr}:${minutes} ${period}`;
}
