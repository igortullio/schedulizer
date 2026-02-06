import { Button, Dialog, DialogContent, DialogDescription, DialogTitle } from '@schedulizer/ui'
import { CheckCircle } from 'lucide-react'

interface ConfirmationModalProps {
  open: boolean
  onClose: () => void
}

export function ConfirmationModal({ open, onClose }: ConfirmationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl border-border/50 bg-white p-8 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <DialogTitle className="mb-3 font-[Poppins] text-2xl font-bold text-foreground">
            Registration completed successfully!
          </DialogTitle>
          <DialogDescription className="mb-8 text-muted-foreground">
            Thank you for your interest in Schedulizer. We will contact you soon via the email and phone number
            provided.
          </DialogDescription>
          <Button
            onClick={onClose}
            className="gradient-accent h-12 w-full cursor-pointer rounded-xl border-0 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl"
          >
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
