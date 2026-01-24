'use client';

interface StatusBadgeProps {
  status: 'pending' | 'approved' | 'rejected' | 'disbursed';
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const styles = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    approved: 'bg-green-100 text-green-800 border-green-300',
    rejected: 'bg-red-100 text-red-800 border-red-300',
    disbursed: 'bg-blue-100 text-blue-800 border-blue-300',
  };

  const labels = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    disbursed: 'Disbursed',
  };

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
