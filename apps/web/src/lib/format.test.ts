import { describe, expect, it } from 'vitest'
import { formatCurrency, formatDate, formatDateShort, formatPrice, getCurrency, getLocale } from './format'

describe('getLocale', () => {
  it('returns pt-BR for pt-BR language', () => {
    expect(getLocale('pt-BR')).toBe('pt-BR')
  })

  it('returns en-US for en language', () => {
    expect(getLocale('en')).toBe('en-US')
  })

  it('returns en-US for unknown language', () => {
    expect(getLocale('fr')).toBe('en-US')
  })
})

describe('getCurrency', () => {
  it('returns BRL for pt-BR language', () => {
    expect(getCurrency('pt-BR')).toBe('BRL')
  })

  it('returns USD for en language', () => {
    expect(getCurrency('en')).toBe('USD')
  })

  it('returns USD for unknown language', () => {
    expect(getCurrency('fr')).toBe('USD')
  })
})

describe('formatPrice', () => {
  it('formats price in USD for en language', () => {
    const result = formatPrice(49.9, 'en')
    expect(result).toContain('49.90')
  })

  it('formats price in BRL for pt-BR language', () => {
    const result = formatPrice(49.9, 'pt-BR')
    expect(result).toContain('49,90')
  })

  it('formats zero price', () => {
    const result = formatPrice(0, 'en')
    expect(result).toContain('0.00')
  })

  it('formats large price', () => {
    const result = formatPrice(1234.56, 'en')
    expect(result).toContain('1,234.56')
  })
})

describe('formatDate', () => {
  it('returns N/A for null date', () => {
    expect(formatDate(null, 'en')).toBe('N/A')
  })

  it('formats date in en locale', () => {
    const dateStr = '2024-01-15T12:00:00Z'
    const result = formatDate(dateStr, 'en')
    const expected = new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    expect(result).toBe(expected)
  })

  it('formats date in pt-BR locale', () => {
    const dateStr = '2024-01-15T12:00:00Z'
    const result = formatDate(dateStr, 'pt-BR')
    const expected = new Date(dateStr).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    expect(result).toBe(expected)
  })

  it('handles unknown language by falling back to en-US', () => {
    const dateStr = '2024-06-15T12:00:00Z'
    const result = formatDate(dateStr, 'unknown')
    const expected = new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    expect(result).toBe(expected)
  })
})

describe('formatDateShort', () => {
  it('formats timestamp in en locale with short month', () => {
    const timestamp = 1705320000
    const result = formatDateShort(timestamp, 'en')
    const expected = new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
    expect(result).toBe(expected)
  })

  it('formats timestamp in pt-BR locale', () => {
    const timestamp = 1705320000
    const result = formatDateShort(timestamp, 'pt-BR')
    const expected = new Date(timestamp * 1000).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
    expect(result).toBe(expected)
  })
})

describe('formatCurrency', () => {
  it('formats cents to dollars for USD', () => {
    const result = formatCurrency(4990, 'usd', 'en')
    expect(result).toContain('49.90')
  })

  it('formats cents to BRL', () => {
    const result = formatCurrency(4990, 'brl', 'pt-BR')
    expect(result).toContain('49,90')
  })

  it('formats zero amount', () => {
    const result = formatCurrency(0, 'usd', 'en')
    expect(result).toContain('0.00')
  })

  it('handles uppercase currency code', () => {
    const result = formatCurrency(9990, 'USD', 'en')
    expect(result).toContain('99.90')
  })
})
