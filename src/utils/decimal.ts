// {{RIPER-10 Action}}
// Role: LD | Task_ID: #restore | Time: 2025-12-24T10:01:59+08:00
// Principle: Money math must not lie.
// Taste: Wrap Decimal with small helpers; avoid floating-point surprises.

import Decimal from "decimal.js"

export type DecimalInput = Decimal.Value

export function toDecimal(value: DecimalInput) {
  return new Decimal(value)
}

export function decimalAdd(a: DecimalInput, b: DecimalInput) {
  return new Decimal(a).plus(b)
}

export function decimalSub(a: DecimalInput, b: DecimalInput) {
  return new Decimal(a).minus(b)
}

export function decimalMul(a: DecimalInput, b: DecimalInput) {
  return new Decimal(a).times(b)
}

export function decimalDiv(a: DecimalInput, b: DecimalInput) {
  return new Decimal(a).div(b)
}
