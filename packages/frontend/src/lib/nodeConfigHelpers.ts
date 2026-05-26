import type {
  HttpMethod,
  IfOperator,
  DelayUnit,
} from '@/types/nodeConfig.types'

export function str(
  config: Record<string, unknown>,
  key: string,
  fallback = ''
): string {
  const v = config[key]
  return typeof v === 'string' ? v : fallback
}

export function num(
  config: Record<string, unknown>,
  key: string,
  fallback: number
): number {
  const v = config[key]
  return typeof v === 'number' ? v : fallback
}

export function arr<T>(config: Record<string, unknown>, key: string): T[] {
  const v = config[key]
  return Array.isArray(v) ? (v as T[]) : []
}

export const HTTP_METHODS: HttpMethod[] = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
]

export const IF_OPERATORS: { value: IfOperator; label: string }[] = [
  { value: '==', label: 'equals (==)' },
  { value: '!=', label: 'not equals (!=)' },
  { value: '>', label: 'greater than (>)' },
  { value: '<', label: 'less than (<)' },
  { value: '>=', label: 'greater or equal (>=)' },
  { value: '<=', label: 'less or equal (<=)' },
  { value: 'contains', label: 'contains' },
  { value: 'not contains', label: 'not contains' },
]

export const DELAY_UNITS: { value: DelayUnit; label: string }[] = [
  { value: 'seconds', label: 'Seconds' },
  { value: 'minutes', label: 'Minutes' },
  { value: 'hours', label: 'Hours' },
]
