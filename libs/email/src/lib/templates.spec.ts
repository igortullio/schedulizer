import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { EmailType } from './types'

const TEMPLATES_DIR = resolve(__dirname, '../templates')
const BRAND_COLOR = '#f54900'
const LOCALES = ['pt-br', 'en'] as const

const TEMPLATE_CONFIGS: Record<
  string,
  { variables: string[]; hasOrganizationHeader: boolean; hasPoweredByFooter: boolean }
> = {
  [EmailType.MagicLink]: {
    variables: ['magicLinkUrl'],
    hasOrganizationHeader: false,
    hasPoweredByFooter: false,
  },
  [EmailType.BookingConfirmation]: {
    variables: [
      'customerName',
      'serviceName',
      'appointmentDate',
      'appointmentTime',
      'organizationName',
      'cancelUrl',
      'rescheduleUrl',
    ],
    hasOrganizationHeader: true,
    hasPoweredByFooter: true,
  },
  [EmailType.BookingCancellation]: {
    variables: ['customerName', 'serviceName', 'appointmentDate', 'appointmentTime', 'organizationName'],
    hasOrganizationHeader: true,
    hasPoweredByFooter: true,
  },
  [EmailType.BookingReschedule]: {
    variables: [
      'customerName',
      'serviceName',
      'oldDate',
      'oldTime',
      'newDate',
      'newTime',
      'organizationName',
      'cancelUrl',
      'rescheduleUrl',
    ],
    hasOrganizationHeader: true,
    hasPoweredByFooter: true,
  },
  [EmailType.AppointmentReminder]: {
    variables: [
      'customerName',
      'serviceName',
      'appointmentDate',
      'appointmentTime',
      'organizationName',
      'cancelUrl',
      'rescheduleUrl',
    ],
    hasOrganizationHeader: true,
    hasPoweredByFooter: true,
  },
  [EmailType.OwnerNewBooking]: {
    variables: ['customerName', 'customerEmail', 'serviceName', 'appointmentDate', 'appointmentTime'],
    hasOrganizationHeader: false,
    hasPoweredByFooter: false,
  },
  [EmailType.OwnerCancellation]: {
    variables: ['customerName', 'customerEmail', 'serviceName', 'appointmentDate', 'appointmentTime'],
    hasOrganizationHeader: false,
    hasPoweredByFooter: false,
  },
  [EmailType.OwnerReschedule]: {
    variables: ['customerName', 'customerEmail', 'serviceName', 'oldDate', 'oldTime', 'newDate', 'newTime'],
    hasOrganizationHeader: false,
    hasPoweredByFooter: false,
  },
  [EmailType.Invitation]: {
    variables: ['inviterName', 'organizationName', 'inviteUrl', 'role'],
    hasOrganizationHeader: true,
    hasPoweredByFooter: true,
  },
}

function readTemplate(emailType: string, locale: string): string {
  const filePath = resolve(TEMPLATES_DIR, `${emailType}.${locale}.html`)
  return readFileSync(filePath, 'utf-8')
}

describe('Email Templates', () => {
  const emailTypes = Object.values(EmailType)

  describe('file existence', () => {
    for (const emailType of emailTypes) {
      for (const locale of LOCALES) {
        it(`should have template file for ${emailType} (${locale})`, () => {
          const filePath = resolve(TEMPLATES_DIR, `${emailType}.${locale}.html`)
          expect(existsSync(filePath)).toBe(true)
        })
      }
    }
  })

  describe('naming convention', () => {
    for (const emailType of emailTypes) {
      for (const locale of LOCALES) {
        it(`${emailType}.${locale}.html should follow kebab-case naming`, () => {
          const fileName = `${emailType}.${locale}.html`
          expect(fileName).toMatch(/^[a-z]+(-[a-z]+)*\.[a-z]{2}(-[a-z]{2})?\.html$/)
        })
      }
    }
  })

  describe('brand color', () => {
    for (const emailType of emailTypes) {
      for (const locale of LOCALES) {
        it(`${emailType} (${locale}) should contain brand color ${BRAND_COLOR}`, () => {
          const content = readTemplate(emailType, locale)
          expect(content).toContain(BRAND_COLOR)
        })
      }
    }
  })

  describe('Schedulizer branding', () => {
    for (const emailType of emailTypes) {
      for (const locale of LOCALES) {
        it(`${emailType} (${locale}) should contain Schedulizer text`, () => {
          const content = readTemplate(emailType, locale)
          expect(content).toContain('Schedulizer')
        })
      }
    }
  })

  describe('template variables', () => {
    for (const emailType of emailTypes) {
      const config = TEMPLATE_CONFIGS[emailType]
      for (const locale of LOCALES) {
        it(`${emailType} (${locale}) should contain all required variables`, () => {
          const content = readTemplate(emailType, locale)
          for (const variable of config.variables) {
            expect(content).toContain(`{{${variable}}}`)
          }
        })
      }
    }
  })

  describe('organization header', () => {
    for (const emailType of emailTypes) {
      const config = TEMPLATE_CONFIGS[emailType]
      for (const locale of LOCALES) {
        if (config.hasOrganizationHeader) {
          it(`${emailType} (${locale}) should have organization name in header`, () => {
            const content = readTemplate(emailType, locale)
            expect(content).toContain('{{organizationName}}')
          })
        }
      }
    }
  })

  describe('powered by footer', () => {
    for (const emailType of emailTypes) {
      const config = TEMPLATE_CONFIGS[emailType]
      for (const locale of LOCALES) {
        if (config.hasPoweredByFooter) {
          it(`${emailType} (${locale}) should have "powered by Schedulizer" footer`, () => {
            const content = readTemplate(emailType, locale)
            expect(content).toContain('powered by Schedulizer')
          })
        }
      }
    }
  })

  describe('language-specific content', () => {
    for (const emailType of emailTypes) {
      it(`${emailType} pt-br template should have lang="pt-BR"`, () => {
        const content = readTemplate(emailType, 'pt-br')
        expect(content).toContain('lang="pt-BR"')
      })
      it(`${emailType} en template should have lang="en"`, () => {
        const content = readTemplate(emailType, 'en')
        expect(content).toContain('lang="en"')
      })
    }
  })

  describe('HTML structure', () => {
    for (const emailType of emailTypes) {
      for (const locale of LOCALES) {
        it(`${emailType} (${locale}) should have valid HTML structure`, () => {
          const content = readTemplate(emailType, locale)
          expect(content).toContain('<!doctype html>')
          expect(content).toContain('<html')
          expect(content).toContain('</html>')
          expect(content).toContain('<head>')
          expect(content).toContain('</head>')
          expect(content).toContain('<body')
          expect(content).toContain('</body>')
          expect(content).toContain('charset="utf-8"')
          expect(content).toContain('viewport')
        })
      }
    }
  })
})
