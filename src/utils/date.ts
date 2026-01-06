import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import timezone from "dayjs/plugin/timezone"
import utc from "dayjs/plugin/utc"

dayjs.extend(relativeTime)
dayjs.extend(utc)
dayjs.extend(timezone)

export function formatDate(value: dayjs.ConfigType, template = "YYYY-MM-DD") {
  return dayjs(value).format(template)
}

export function formatDateTime(value: dayjs.ConfigType, template = "YYYY-MM-DD HH:mm:ss") {
  return dayjs(value).format(template)
}

export function fromNow(value: dayjs.ConfigType) {
  return dayjs(value).fromNow()
}

export { default as dayjs } from "dayjs"
