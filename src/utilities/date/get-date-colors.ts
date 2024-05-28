import dayjs from "dayjs";

type DateColors = "success" | "processing" | "error" | "default" | "warning";

export const getDateColor = ({ start, end }: { start?: string | null; end?: string | null }): DateColors => {
  if (!start || !end) {
    return "default";
  }

  const startDate = dayjs(start);
  const endDate = dayjs(end);
  const today = dayjs();

  if (today.isAfter(endDate)) {
    return "error";
  } else if (today.isAfter(startDate) && today.isBefore(endDate)) {
    return "processing";
  } else {
    return "default";
  }
};