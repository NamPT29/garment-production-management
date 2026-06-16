import { Chip } from '@mui/material';

const statusColors = {
  DRAFT: 'default',
  CONFIRMED: 'info',
  PLANNED: 'primary',
  IN_PRODUCTION: 'warning',
  QUALITY_CHECK: 'secondary',
  COMPLETED: 'success',
  DELIVERED: 'success',
  CANCELLED: 'error',
};

const priorityColors = {
  LOW: 'default',
  NORMAL: 'info',
  HIGH: 'warning',
  URGENT: 'error',
};

export function StatusChip({ value }) {
  return <Chip size="small" label={value} color={statusColors[value] ?? 'default'} />;
}

export function PriorityChip({ value }) {
  return <Chip size="small" label={value} color={priorityColors[value] ?? 'default'} />;
}
