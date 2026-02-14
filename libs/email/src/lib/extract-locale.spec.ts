import { describe, expect, it } from 'vitest'
import { extractLocale } from './extract-locale'

describe('extractLocale', () => {
  it('should return pt-BR when acceptLanguage is null', () => {
    expect(extractLocale(null)).toBe('pt-BR')
  })
  it('should return pt-BR when acceptLanguage is empty string', () => {
    expect(extractLocale('')).toBe('pt-BR')
  })
  it('should return en when acceptLanguage starts with en', () => {
    expect(extractLocale('en')).toBe('en')
  })
  it('should return en when acceptLanguage is en-US', () => {
    expect(extractLocale('en-US')).toBe('en')
  })
  it('should return en when acceptLanguage is EN (uppercase)', () => {
    expect(extractLocale('EN')).toBe('en')
  })
  it('should return pt-BR for pt-BR value', () => {
    expect(extractLocale('pt-BR')).toBe('pt-BR')
  })
  it('should return pt-BR for pt value', () => {
    expect(extractLocale('pt')).toBe('pt-BR')
  })
  it('should return pt-BR for unknown locale', () => {
    expect(extractLocale('fr-FR')).toBe('pt-BR')
  })
  it('should handle whitespace', () => {
    expect(extractLocale('  en  ')).toBe('en')
  })
})
