import { Button } from '@schedulizer/ui'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { CheckCircle, X } from 'lucide-react'

interface ConfirmationModalProps {
  open: boolean
  onClose: () => void
}

export function ConfirmationModal({ open, onClose }: ConfirmationModalProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onClose}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border/50 bg-white p-8 shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
            <X className="h-5 w-5" />
            <span className="sr-only">Fechar</span>
          </DialogPrimitive.Close>

          <div className="flex flex-col items-center text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>

            <DialogPrimitive.Title className="mb-3 font-[Poppins] text-2xl font-bold text-foreground">
              Cadastro realizado com sucesso!
            </DialogPrimitive.Title>

            <DialogPrimitive.Description className="mb-8 text-muted-foreground">
              Obrigado pelo seu interesse no Schedulizer. Em breve entraremos em contato através do e-mail e telefone
              fornecidos.
            </DialogPrimitive.Description>

            <Button
              onClick={onClose}
              className="gradient-accent h-12 w-full cursor-pointer rounded-xl border-0 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl"
            >
              Entendido
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
