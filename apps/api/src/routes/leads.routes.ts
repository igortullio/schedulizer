import { Router } from 'express'
import { createLeadSchema } from '../lib/validation/leads.validation'
import { leadsService } from '../services/leads.service'

const router = Router()

router.post('/', async (req, res) => {
  try {
    const validation = createLeadSchema.safeParse(req.body)

    if (!validation.success) {
      return res.status(400).json({
        error: validation.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
      })
    }

    const lead = await leadsService.createLead(validation.data)

    return res.status(201).json({
      data: {
        id: lead.id,
        message: 'Lead cadastrado com sucesso',
      },
    })
  } catch (error) {
    console.error('Error creating lead:', error)
    return res.status(500).json({
      error: 'Erro ao cadastrar lead. Por favor, tente novamente.',
    })
  }
})

export const leadsRoutes = router
