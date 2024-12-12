import { Units } from "../types/activity"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const unitConversion = {
  convertDistance: (value: number, toUnit: Units): number => {
    switch (toUnit) {
      case "metric":
        return value * 0.001
      case "imperial":
        return value * 0.000621371
      default:
        throw new Error(`Unsupported unit type: ${toUnit}`)
    }
  },
  convertElevation: (value: number, toUnit: Units): number => {
    switch (toUnit) {
      case "metric":
        return value
      case "imperial":
        return value * 3.28084
      default:
        throw new Error(`Unsupported unit type: ${toUnit}`)
    }
  },
  convertTime: (value: number, toUnit: "minutes" | "hours"): number => {
    switch (toUnit) {
      case "minutes":
        return value / 60
      case "hours":
        return value / 3600
      default:
        throw new Error(`Unsupported unit type: ${toUnit}`)
    }
  },
  convertSpeed: (value: number, toUnit: Units): number => {
    switch (toUnit) {
      case "metric":
        return value * 3.6
      case "imperial":
        return value * 2.23694
      default:
        throw new Error(`Unsupported unit type: ${toUnit}`)
    }
  }
}