// {{RIPER-10 Action}}
// Role: LD | Task_ID: #restore | Time: 2025-12-24T10:01:59+08:00
// Principle: Dates are hard—centralize formatting rules.
// Taste: Configure dayjs once; import helpers everywhere.

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
