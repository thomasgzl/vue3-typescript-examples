import dayjs from 'dayjs';

export function addDecimalMonth(date: any, months: any) {
  const days = (months % 1) * 30;
  return dayjs(date).add(months, 'month').add(days, 'day');
}
