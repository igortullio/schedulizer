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

export interface CreateServiceDTO {
  name: string
  description?: string
  durationMinutes: number
  price?: number
}

export interface UpdateServiceDTO {
  name?: string
  description?: string
  durationMinutes?: number
  price?: number
  active?: boolean
}

// Schedule types
export interface Schedule {
  id: string
  organizationId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateScheduleDTO {
  dayOfWeek: number
  startTime: string
  endTime: string
}

export interface UpdateScheduleDTO {
  startTime?: string
  endTime?: string
  active?: boolean
}

// Appointment types
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'cancelled' | 'completed'

export interface Appointment {
  id: string
  organizationId: string
  serviceId: string
  customerId?: string | null
  customerName: string
  customerEmail: string
  customerPhone?: string | null
  startTime: Date
  endTime: Date
  status: AppointmentStatus
  notes?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateAppointmentDTO {
  serviceId: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  startTime: string
  notes?: string
}

export interface UpdateAppointmentDTO {
  status?: AppointmentStatus
  notes?: string
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
