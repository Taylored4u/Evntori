import { Badge } from '@/components/ui/badge';
import { CircleCheck as CheckCircle, Circle as XCircle, Clock, CircleAlert as AlertCircle, RotateCcw } from 'lucide-react';

interface PaymentStatusBadgeProps {
  status: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
  className?: string;
}

export function PaymentStatusBadge({ status, className }: PaymentStatusBadgeProps) {
  const statusConfig = {
    pending: {
      label: 'Payment Pending',
      variant: 'secondary' as const,
      icon: Clock,
    },
    paid: {
      label: 'Paid',
      variant: 'default' as const,
      icon: CheckCircle,
    },
    failed: {
      label: 'Payment Failed',
      variant: 'destructive' as const,
      icon: XCircle,
    },
    refunded: {
      label: 'Refunded',
      variant: 'outline' as const,
      icon: RotateCcw,
    },
    partially_refunded: {
      label: 'Partially Refunded',
      variant: 'outline' as const,
      icon: AlertCircle,
    },
  };

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={className}>
      <Icon className="mr-1 h-3 w-3" />
      {config.label}
    </Badge>
  );
}
