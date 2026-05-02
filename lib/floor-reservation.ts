import { FloorTimeSlot } from "@prisma/client";

export const floorTimeSlots: FloorTimeSlot[] = [
  "S0800_1000",
  "S1000_1200",
  "S1200_1400",
  "S1400_1600",
  "S1600_1800",
  "S1800_2000",
  "S2000_2200"
];

export function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function addDays(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

export function toDateOnly(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map((item) => Number(item));
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function isDateInNext7Days(date: Date) {
  const start = startOfToday();
  const end = addDays(start, 6);
  return date >= start && date <= end;
}

export function cleanupBeforeTodayWhere() {
  return {
    date: {
      lt: startOfToday()
    }
  };
}
