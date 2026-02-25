import { useState } from 'react';
import type { Bid, User } from '@/prisma/generated/prisma/client';

interface BidRowProps {
  bid: Bid;
  users: User[];
  onMutated: () => void;
}

const STATUS_CLASSES: Record<string, string> = {
  PENDING:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  ACCEPTED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export default function BidRow({ bid, users, onMutated }: BidRowProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const user = users.find(u => u.id === bid.userId);
  const userName = user?.name ?? bid.userId;

  async function handleAction(action: 'accept' | 'reject') {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/bids/${bid.id}/${action}`, {
        method: 'POST',
      });
      if (res.status === 409) {
        const body = await res.json();
        setError(body.error ?? 'Conflict');
      } else if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? `Error ${res.status}`);
      } else {
        onMutated();
      }
    } catch {
      setError('Network error');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="ml-6 mt-1 pl-3 border-l-2 border-gray-200 dark:border-gray-600 py-1">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium">{userName}</span>
        <span className="text-gray-600 dark:text-gray-400">
          ${(bid.price / 100).toFixed(2)}
        </span>
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_CLASSES[bid.status] ?? ''}`}
        >
          {bid.status}
        </span>
        {bid.status === 'PENDING' && (
          <>
            <button
              onClick={() => handleAction('accept')}
              disabled={isSubmitting}
              className="px-2 py-0.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              Accept
            </button>
            <button
              onClick={() => handleAction('reject')}
              disabled={isSubmitting}
              className="px-2 py-0.5 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              Reject
            </button>
          </>
        )}
      </div>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
