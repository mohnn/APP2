/**
 * Universal formatters for Modern British Kids
 */

export function formatTime12h(timeStr?: string | null): string {
  if (!timeStr) return '';
  const trimmed = timeStr.trim();
  if (!trimmed) return '';

  // If already formatted with Arabic or English AM/PM
  if (
    trimmed.includes('ص') || 
    trimmed.includes('م') || 
    trimmed.toUpperCase().includes('AM') || 
    trimmed.toUpperCase().includes('PM')
  ) {
    return trimmed;
  }

  // Handle standard HH:mm or HH:mm:ss
  const parts = trimmed.split(':');
  if (parts.length < 2) return trimmed;

  const hoursNum = parseInt(parts[0], 10);
  const minutesNum = parseInt(parts[1], 10);
  if (isNaN(hoursNum) || isNaN(minutesNum)) return trimmed;

  const ampm = hoursNum >= 12 ? 'م' : 'ص';
  let h12 = hoursNum % 12;
  if (h12 === 0) h12 = 12;

  const hStr = h12 < 10 ? `0${h12}` : `${h12}`;
  const mStr = minutesNum < 10 ? `0${minutesNum}` : `${minutesNum}`;

  return `${hStr}:${mStr} ${ampm}`;
}

export function getCurrentTime12h(): string {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const ampm = hours >= 12 ? 'م' : 'ص';
  let h12 = hours % 12;
  if (h12 === 0) h12 = 12;
  const hStr = h12 < 10 ? `0${h12}` : `${h12}`;
  const mStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${hStr}:${mStr} ${ampm}`;
}
