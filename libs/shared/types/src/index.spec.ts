import { describe, expect, it } from 'vitest'
import type {
  Appointment,
  AppointmentStatus,
  BookingOrganization,
  CreateLeadRequest,
  CreateLeadResponse,
  Lead,
  Organization,
  Schedule,
  SchedulePeriod,
  TimeBlock,
  TimeSlot,
} from './index'
import {
  BulkUpsertSchedulesSchema,
  CreateAppointmentSchema,
  CreateServiceSchema,
  CreateTimeBlockSchema,
  RescheduleAppointmentSchema,
  SchedulePeriodSchema,
  UpdateOrganizationSettingsSchema,
  UpdateServiceSchema,
  UpsertScheduleSchema,
} from './index'

describe('Lead Types', () => {
  it('should export Lead interface', () => {
    const lead: Lead = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'João Silva',
      email: 'joao@example.com',
      phone: '+5511999999999',
      planInterest: 'essential',
      createdAt: new Date(),
    }
    expect(lead.id).toBeDefined()
    expect(lead.name).toBeDefined()
    expect(lead.email).toBeDefined()
    expect(lead.phone).toBeDefined()
    expect(lead.planInterest).toBeDefined()
    expect(lead.createdAt).toBeDefined()
  })

  it('should export CreateLeadRequest interface without id and createdAt', () => {
    const request: CreateLeadRequest = {
      name: 'Maria Santos',
      email: 'maria@example.com',
      phone: '+5511888888888',
      planInterest: 'professional',
    }
    expect(request.name).toBeDefined()
    expect(request.email).toBeDefined()
    expect(request.phone).toBeDefined()
    expect(request.planInterest).toBeDefined()
    // @ts-expect-error - id should not exist in CreateLeadRequest
    expect(request.id).toBeUndefined()
    // @ts-expect-error - createdAt should not exist in CreateLeadRequest
    expect(request.createdAt).toBeUndefined()
  })

  it('should export CreateLeadResponse interface with correct structure', () => {
    const response: CreateLeadResponse = {
      data: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        message: 'Lead criado com sucesso',
      },
    }
    expect(response.data).toBeDefined()
    expect(response.data.id).toBeDefined()
    expect(response.data.message).toBeDefined()
  })

  it('should restrict planInterest to valid enum values', () => {
    const leadEssential: Lead = {
      id: '123',
      name: 'Test',
      email: 'test@example.com',
      phone: '+5511999999999',
      planInterest: 'essential',
      createdAt: new Date(),
    }
    const leadProfessional: Lead = {
      id: '456',
      name: 'Test',
      email: 'test@example.com',
      phone: '+5511999999999',
      planInterest: 'professional',
      createdAt: new Date(),
    }
    expect(leadEssential.planInterest).toBe('essential')
    expect(leadProfessional.planInterest).toBe('professional')
  })

  it('should have correct field types in Lead interface', () => {
    const lead: Lead = {
      id: '123',
      name: 'Test User',
      email: 'test@example.com',
      phone: '+5511999999999',
      planInterest: 'essential',
      createdAt: new Date(),
    }
    expect(typeof lead.id).toBe('string')
    expect(typeof lead.name).toBe('string')
    expect(typeof lead.email).toBe('string')
    expect(typeof lead.phone).toBe('string')
    expect(['essential', 'professional']).toContain(lead.planInterest)
    expect(lead.createdAt).toBeInstanceOf(Date)
  })

  it('should have correct field types in CreateLeadRequest', () => {
    const request: CreateLeadRequest = {
      name: 'Test User',
      email: 'test@example.com',
      phone: '+5511999999999',
      planInterest: 'professional',
    }
    expect(typeof request.name).toBe('string')
    expect(typeof request.email).toBe('string')
    expect(typeof request.phone).toBe('string')
    expect(['essential', 'professional']).toContain(request.planInterest)
  })
})

describe('Organization Types', () => {
  it('should include timezone field', () => {
    const org: Organization = {
      id: '123',
      name: 'Test Org',
      slug: 'test-org',
      timezone: 'America/Sao_Paulo',
      createdAt: new Date(),
    }
    expect(org.timezone).toBe('America/Sao_Paulo')
  })
})

describe('Schedule Types', () => {
  it('should have serviceId and isActive', () => {
    const schedule: Schedule = {
      id: '123',
      serviceId: '456',
      dayOfWeek: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    expect(schedule.serviceId).toBe('456')
    expect(schedule.isActive).toBe(true)
  })

  it('should export SchedulePeriod interface', () => {
    const period: SchedulePeriod = {
      id: '123',
      scheduleId: '456',
      startTime: '09:00',
      endTime: '12:00',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    expect(period.startTime).toBe('09:00')
    expect(period.endTime).toBe('12:00')
  })
})

describe('TimeBlock Types', () => {
  it('should export TimeBlock interface', () => {
    const block: TimeBlock = {
      id: '123',
      organizationId: '456',
      date: '2025-01-15',
      startTime: '14:00',
      endTime: '16:00',
      reason: 'Holiday',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    expect(block.date).toBe('2025-01-15')
    expect(block.reason).toBe('Holiday')
  })
})

describe('Appointment Types', () => {
  it('should have updated structure with managementToken', () => {
    const appointment: Appointment = {
      id: '123',
      organizationId: '456',
      serviceId: '789',
      startDatetime: new Date(),
      endDatetime: new Date(),
      status: 'pending',
      customerName: 'John',
      customerEmail: 'john@test.com',
      customerPhone: '+5511999999999',
      managementToken: 'abc-123',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    expect(appointment.managementToken).toBe('abc-123')
    expect(appointment.startDatetime).toBeInstanceOf(Date)
  })

  it('should have correct status enum values', () => {
    const statuses: AppointmentStatus[] = ['pending', 'confirmed', 'cancelled', 'completed', 'no_show']
    expect(statuses).toHaveLength(5)
  })
})

describe('Booking Types', () => {
  it('should export TimeSlot interface', () => {
    const slot: TimeSlot = {
      startTime: '2025-01-15T09:00:00Z',
      endTime: '2025-01-15T09:30:00Z',
    }
    expect(slot.startTime).toBeDefined()
    expect(slot.endTime).toBeDefined()
  })

  it('should export BookingOrganization interface', () => {
    const booking: BookingOrganization = {
      organizationName: 'Test Org',
      slug: 'test-org',
      services: [
        {
          id: '123',
          name: 'Haircut',
          description: 'A nice haircut',
          durationMinutes: 30,
          price: 5000,
        },
      ],
    }
    expect(booking.services).toHaveLength(1)
  })
})

describe('Zod Schemas', () => {
  describe('CreateServiceSchema', () => {
    it('should validate correct service input', () => {
      const result = CreateServiceSchema.safeParse({
        name: 'Haircut',
        duration: 30,
        price: '50.00',
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid duration', () => {
      const result = CreateServiceSchema.safeParse({
        name: 'Haircut',
        duration: 3,
        price: '50.00',
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid price format', () => {
      const result = CreateServiceSchema.safeParse({
        name: 'Haircut',
        duration: 30,
        price: '50',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('UpdateServiceSchema', () => {
    it('should allow partial updates', () => {
      const result = UpdateServiceSchema.safeParse({ name: 'New Name' })
      expect(result.success).toBe(true)
    })
  })

  describe('SchedulePeriodSchema', () => {
    it('should validate correct period', () => {
      const result = SchedulePeriodSchema.safeParse({
        startTime: '09:00',
        endTime: '12:00',
      })
      expect(result.success).toBe(true)
    })

    it('should reject startTime >= endTime', () => {
      const result = SchedulePeriodSchema.safeParse({
        startTime: '14:00',
        endTime: '12:00',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('UpsertScheduleSchema', () => {
    it('should validate schedule with periods', () => {
      const result = UpsertScheduleSchema.safeParse({
        dayOfWeek: 1,
        isActive: true,
        periods: [{ startTime: '09:00', endTime: '12:00' }],
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid dayOfWeek', () => {
      const result = UpsertScheduleSchema.safeParse({
        dayOfWeek: 7,
        isActive: true,
        periods: [],
      })
      expect(result.success).toBe(false)
    })
  })

  describe('BulkUpsertSchedulesSchema', () => {
    it('should validate bulk schedules', () => {
      const result = BulkUpsertSchedulesSchema.safeParse({
        schedules: [
          {
            dayOfWeek: 1,
            isActive: true,
            periods: [{ startTime: '09:00', endTime: '18:00' }],
          },
        ],
      })
      expect(result.success).toBe(true)
    })
  })

  describe('CreateTimeBlockSchema', () => {
    it('should validate correct time block', () => {
      const result = CreateTimeBlockSchema.safeParse({
        date: '2025-01-15',
        startTime: '14:00',
        endTime: '16:00',
        reason: 'Holiday',
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid date format', () => {
      const result = CreateTimeBlockSchema.safeParse({
        date: '15/01/2025',
        startTime: '14:00',
        endTime: '16:00',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('CreateAppointmentSchema', () => {
    it('should validate correct appointment input', () => {
      const result = CreateAppointmentSchema.safeParse({
        serviceId: '550e8400-e29b-41d4-a716-446655440000',
        startTime: '2025-01-15T09:00:00Z',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '+5511999999999',
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const result = CreateAppointmentSchema.safeParse({
        serviceId: '550e8400-e29b-41d4-a716-446655440000',
        startTime: '2025-01-15T09:00:00Z',
        customerName: 'John Doe',
        customerEmail: 'not-an-email',
        customerPhone: '+5511999999999',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('RescheduleAppointmentSchema', () => {
    it('should validate correct reschedule input', () => {
      const result = RescheduleAppointmentSchema.safeParse({
        startTime: '2025-01-16T10:00:00Z',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('UpdateOrganizationSettingsSchema', () => {
    it('should validate slug with lowercase and hyphens', () => {
      const result = UpdateOrganizationSettingsSchema.safeParse({
        slug: 'my-business',
      })
      expect(result.success).toBe(true)
    })

    it('should validate slug with only lowercase letters', () => {
      const result = UpdateOrganizationSettingsSchema.safeParse({
        slug: 'mybusiness',
      })
      expect(result.success).toBe(true)
    })

    it('should validate slug with numbers', () => {
      const result = UpdateOrganizationSettingsSchema.safeParse({
        slug: 'business-123',
      })
      expect(result.success).toBe(true)
    })

    it('should reject slug with uppercase letters', () => {
      const result = UpdateOrganizationSettingsSchema.safeParse({
        slug: 'My-Business',
      })
      expect(result.success).toBe(false)
    })

    it('should reject slug with special characters', () => {
      const result = UpdateOrganizationSettingsSchema.safeParse({
        slug: 'my_business!',
      })
      expect(result.success).toBe(false)
    })

    it('should reject slug with spaces', () => {
      const result = UpdateOrganizationSettingsSchema.safeParse({
        slug: 'my business',
      })
      expect(result.success).toBe(false)
    })

    it('should reject slug with leading hyphen', () => {
      const result = UpdateOrganizationSettingsSchema.safeParse({
        slug: '-my-business',
      })
      expect(result.success).toBe(false)
    })

    it('should reject slug with trailing hyphen', () => {
      const result = UpdateOrganizationSettingsSchema.safeParse({
        slug: 'my-business-',
      })
      expect(result.success).toBe(false)
    })

    it('should reject slug shorter than 3 characters', () => {
      const result = UpdateOrganizationSettingsSchema.safeParse({
        slug: 'ab',
      })
      expect(result.success).toBe(false)
    })

    it('should validate timezone only', () => {
      const result = UpdateOrganizationSettingsSchema.safeParse({
        timezone: 'America/Sao_Paulo',
      })
      expect(result.success).toBe(true)
    })

    it('should validate both slug and timezone', () => {
      const result = UpdateOrganizationSettingsSchema.safeParse({
        slug: 'my-business',
        timezone: 'UTC',
      })
      expect(result.success).toBe(true)
    })

    it('should reject empty object (at least one field required)', () => {
      const result = UpdateOrganizationSettingsSchema.safeParse({})
      expect(result.success).toBe(false)
    })

    it('should reject empty timezone string', () => {
      const result = UpdateOrganizationSettingsSchema.safeParse({
        timezone: '',
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid IANA timezone', () => {
      const result = UpdateOrganizationSettingsSchema.safeParse({
        timezone: 'Not/A_Timezone',
      })
      expect(result.success).toBe(false)
    })

    it('should accept valid IANA timezone Europe/London', () => {
      const result = UpdateOrganizationSettingsSchema.safeParse({
        timezone: 'Europe/London',
      })
      expect(result.success).toBe(true)
    })
  })
})
