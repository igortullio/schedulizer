import { z } from 'zod'

// User types
export interface User {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image?: string | null
  createdAt: Date
  updatedAt: Date
}

// Organization types
export interface Organization {
  id: string
  name: string
  slug: string
  logo?: string | null
  timezone: string
  createdAt: Date
  metadata?: string | null
}

export interface Member {
  id: string
  organizationId: string
  userId: string
  role: 'owner' | 'admin' | 'member'
  createdAt: Date
}

// Service types
export interface Service {
  id: string
  organizationId: string
  name: string
  description?: string | null
  durationMinutes: number
  price?: number | null
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export const CreateServiceSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  duration: z.number().int().min(5).max(480),
  price: z.string().regex(/^\d+\.\d{2}$/),
  active: z.boolean().optional().default(true),
})

export const UpdateServiceSchema = CreateServiceSchema.partial()

export type CreateServiceInput = z.infer<typeof CreateServiceSchema>
export type UpdateServiceInput = z.infer<typeof UpdateServiceSchema>

// Schedule types
export interface Schedule {
  id: string
  serviceId: string
  dayOfWeek: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface SchedulePeriod {
  id: string
  scheduleId: string
  startTime: string
  endTime: string
  createdAt: Date
  updatedAt: Date
}

export const SchedulePeriodSchema = z
  .object({
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: 'startTime must be before endTime',
  })

export const UpsertScheduleSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  isActive: z.boolean(),
  periods: z.array(SchedulePeriodSchema),
})

export const BulkUpsertSchedulesSchema = z.object({
  schedules: z.array(UpsertScheduleSchema),
})

export type SchedulePeriodInput = z.infer<typeof SchedulePeriodSchema>
export type UpsertScheduleInput = z.infer<typeof UpsertScheduleSchema>
export type BulkUpsertSchedulesInput = z.infer<typeof BulkUpsertSchedulesSchema>

// Time Block types
export interface TimeBlock {
  id: string
  organizationId: string
  date: string
  startTime: string
  endTime: string
  reason?: string | null
  createdAt: Date
  updatedAt: Date
}

export const CreateTimeBlockSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    reason: z.string().max(255).optional(),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: 'startTime must be before endTime',
  })

export type CreateTimeBlockInput = z.infer<typeof CreateTimeBlockSchema>

// Appointment types
export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'

export interface Appointment {
  id: string
  organizationId: string
  serviceId: string
  startDatetime: Date
  endDatetime: Date
  status: AppointmentStatus
  customerName: string
  customerEmail: string
  customerPhone: string
  managementToken: string
  reminderSentAt?: Date | null
  notes?: string | null
  createdAt: Date
  updatedAt: Date
}

// Booking types (public booking page)
export const CreateAppointmentSchema = z.object({
  serviceId: z.string().uuid(),
  startTime: z.string().datetime(),
  customerName: z.string().min(1).max(255),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(8).max(50),
})

export const RescheduleAppointmentSchema = z.object({
  startTime: z.string().datetime(),
})

export type CreateAppointmentInput = z.infer<typeof CreateAppointmentSchema>
export type RescheduleAppointmentInput = z.infer<typeof RescheduleAppointmentSchema>

export interface TimeSlot {
  startTime: string
  endTime: string
}

export interface BookingOrganization {
  organizationName: string
  slug: string
  services: Pick<Service, 'id' | 'name' | 'description' | 'durationMinutes' | 'price'>[]
}

// Lead types
export interface Lead {
  id: string
  name: string
  email: string
  phone: string
  planInterest: 'essential' | 'professional'
  createdAt: Date
}

export interface CreateLeadRequest {
  name: string
  email: string
  phone: string
  planInterest: 'essential' | 'professional'
}

export interface CreateLeadResponse {
  data: { id: string; message: string }
}

// API response types
export interface ApiResponse<T> {
  data: T
  success: true
}

export interface ApiError {
  error: string
  message: string
  success: false
}

export type ApiResult<T> = ApiResponse<T> | ApiError

// Pagination types
export interface PaginatedRequest {
  page?: number
  limit?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
