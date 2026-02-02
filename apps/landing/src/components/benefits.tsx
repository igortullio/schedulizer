import type { LucideIcon } from 'lucide-react'
import { Bell, Calendar, Clock, Users } from 'lucide-react'

interface Benefit {
  icon: LucideIcon
  title: string
  description: string
}

const benefits: Benefit[] = [
  {
    icon: Calendar,
    title: 'Agendamentos online 24/7',
    description: 'Seus clientes podem agendar a qualquer hora, de qualquer lugar. Nunca perca uma oportunidade.',
  },
  {
    icon: Bell,
    title: 'Lembretes automáticos',
    description: 'Reduza faltas com notificações automáticas por WhatsApp e e-mail.',
  },
  {
    icon: Clock,
    title: 'Organização de horários',
    description: 'Visualize e gerencie todos os seus agendamentos em um só lugar.',
  },
  {
    icon: Users,
    title: 'Gestão de múltiplos profissionais',
    description: 'Controle a agenda de toda a sua equipe de forma centralizada.',
  },
]

export function Benefits() {
  return (
    <section className="px-4 py-20 md:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Por que escolher o{' '}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Schedulizer
            </span>
            ?
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Tudo que você precisa para gerenciar seu negócio de forma eficiente
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon
            return (
              <div
                key={benefit.title}
                className="glass hover-lift group cursor-pointer rounded-2xl p-6"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 transition-transform duration-200 group-hover:scale-110">
                  <Icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mb-3 text-lg font-semibold text-foreground">{benefit.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{benefit.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
