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
