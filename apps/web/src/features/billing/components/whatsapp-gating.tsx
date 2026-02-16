import { Badge, Button } from '@igortullio-ui/react'
import { Lock, MessageCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

interface WhatsAppGatingProps {
  isAvailable: boolean
}

export function WhatsAppGating({ isAvailable }: WhatsAppGatingProps) {
  const { t } = useTranslation('billing')
  const navigate = useNavigate()
  if (isAvailable) return null
  function handleUpgrade() {
    navigate('/pricing?plan=professional')
  }
  return (
    <div
      className="flex items-center justify-between rounded-lg border border-dashed border-muted-foreground/30 bg-muted/50 p-4"
      data-testid="whatsapp-gating"
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <MessageCircle className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <Lock className="absolute -bottom-1 -right-1 h-3 w-3 text-muted-foreground" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">{t('whatsappGating.title')}</p>
          <Badge variant="outline" className="mt-1 text-xs">
            {t('whatsappGating.badge')}
          </Badge>
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={handleUpgrade} data-testid="whatsapp-upgrade-button">
        {t('whatsappGating.upgrade')}
      </Button>
    </div>
  )
}
