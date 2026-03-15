import dayjs from "dayjs";

import "dayjs/locale/id";


// Set locale ke Indonesia
dayjs.locale("id");

// Helper: parse date (tanggal saja dari string ISO)
const parseDate = (date?: dayjs.ConfigType) => {
  if (!date) return dayjs();
  if (typeof date === "string") {
    const dateStr = date.split("T")[0];
    const [year, month, day] = dateStr.split("-").map(Number);
    return dayjs(new Date(year, month - 1, day));
  }
  return dayjs(date);
};

export default Object.assign(parseDate, dayjs, {
  locale: dayjs.locale,
  extend: dayjs.extend,
});
