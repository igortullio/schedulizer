import { describe, expect, it } from 'vitest'
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from './table'

describe('Table Components', () => {
  it('exports Table component', () => {
    expect(Table).toBeDefined()
    expect(typeof Table).toBe('object')
  })

  it('exports TableHeader component', () => {
    expect(TableHeader).toBeDefined()
    expect(typeof TableHeader).toBe('object')
  })

  it('exports TableBody component', () => {
    expect(TableBody).toBeDefined()
    expect(typeof TableBody).toBe('object')
  })

  it('exports TableFooter component', () => {
    expect(TableFooter).toBeDefined()
    expect(typeof TableFooter).toBe('object')
  })

  it('exports TableRow component', () => {
    expect(TableRow).toBeDefined()
    expect(typeof TableRow).toBe('object')
  })

  it('exports TableHead component', () => {
    expect(TableHead).toBeDefined()
    expect(typeof TableHead).toBe('object')
  })

  it('exports TableCell component', () => {
    expect(TableCell).toBeDefined()
    expect(typeof TableCell).toBe('object')
  })

  it('exports TableCaption component', () => {
    expect(TableCaption).toBeDefined()
    expect(typeof TableCaption).toBe('object')
  })

  it('Table has correct displayName', () => {
    expect(Table.displayName).toBe('Table')
  })

  it('TableHeader has correct displayName', () => {
    expect(TableHeader.displayName).toBe('TableHeader')
  })

  it('TableBody has correct displayName', () => {
    expect(TableBody.displayName).toBe('TableBody')
  })

  it('TableRow has correct displayName', () => {
    expect(TableRow.displayName).toBe('TableRow')
  })

  it('TableHead has correct displayName', () => {
    expect(TableHead.displayName).toBe('TableHead')
  })

  it('TableCell has correct displayName', () => {
    expect(TableCell.displayName).toBe('TableCell')
  })

  it('TableCaption has correct displayName', () => {
    expect(TableCaption.displayName).toBe('TableCaption')
  })
})
