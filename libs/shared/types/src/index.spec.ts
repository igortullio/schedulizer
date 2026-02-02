import { describe, expect, it } from 'vitest'
import type { CreateLeadRequest, CreateLeadResponse, Lead } from './index'

describe('Lead Types', () => {
  it('should export Lead interface', () => {
    // Type assertion tests - if these compile, types are correctly defined
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
