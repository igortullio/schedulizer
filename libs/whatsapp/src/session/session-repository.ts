import type { ChatbotContext, ChatbotSession, ChatbotStep } from './session-types'

const SESSION_TTL_MINUTES = 30
const MS_PER_MINUTE = 60_000

interface SessionRow {
  id: string
  phoneNumber: string
  organizationId: string
  currentStep: string
  context: unknown
  createdAt: Date
  updatedAt: Date
}

export interface SessionDb {
  findActiveByPhone(phoneNumber: string, organizationId: string, ttlThreshold: Date): Promise<SessionRow | undefined>
  create(params: { phoneNumber: string; organizationId: string }): Promise<SessionRow>
  update(sessionId: string, params: { currentStep: string; context: ChatbotContext }): Promise<SessionRow>
  deleteExpired(ttlThreshold: Date): Promise<void>
}

function toSession(row: SessionRow): ChatbotSession {
  return {
    id: row.id,
    phoneNumber: row.phoneNumber,
    organizationId: row.organizationId,
    currentStep: row.currentStep as ChatbotStep,
    context: (row.context ?? {}) as ChatbotContext,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

function createTtlThreshold(): Date {
  return new Date(Date.now() - SESSION_TTL_MINUTES * MS_PER_MINUTE)
}

export class SessionRepository {
  constructor(private readonly sessionDb: SessionDb) {}

  async findActiveByPhone(phoneNumber: string, organizationId: string): Promise<ChatbotSession | null> {
    const row = await this.sessionDb.findActiveByPhone(phoneNumber, organizationId, createTtlThreshold())
    if (!row) return null
    return toSession(row)
  }

  async create(params: { phoneNumber: string; organizationId: string }): Promise<ChatbotSession> {
    const row = await this.sessionDb.create(params)
    return toSession(row)
  }

  async update(
    sessionId: string,
    params: { currentStep: ChatbotStep; context: ChatbotContext },
  ): Promise<ChatbotSession> {
    const row = await this.sessionDb.update(sessionId, params)
    return toSession(row)
  }

  async deleteExpired(): Promise<void> {
    await this.sessionDb.deleteExpired(createTtlThreshold())
  }
}
