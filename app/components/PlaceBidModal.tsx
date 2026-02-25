import { useEffect, useState } from 'react';

interface PlaceBidModalProps {
  isOpen: boolean;
  collectionId: string | null;
  collectionName: string;
  selectedUserId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PlaceBidModal({
  isOpen,
  collectionId,
  collectionName,
  selectedUserId,
  onClose,
  onSuccess,
}: PlaceBidModalProps) {
  const [price, setPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen || !collectionId) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUserId) return;
    setIsSubmitting(true);
    setError(null);
    const cents = Math.round(parseFloat(price) * 100);
    try {
      const res = await fetch(`/api/collections/${collectionId}/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId, price: cents }),
      });
      if (res.status === 201) {
        onSuccess();
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? `Error ${res.status}`);
      }
    } catch {
      setError('Network error');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="place-bid-title"
        className="bg-background rounded-lg p-6 w-full max-w-md shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <h2 id="place-bid-title" className="text-lg font-semibold mb-1">
          Place Bid
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Collection:{' '}
          <span className="font-medium text-foreground">{collectionName}</span>
        </p>
        {!selectedUserId && (
          <p className="text-sm text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-md px-3 py-2 mb-3">
            Please select a user from the top bar before placing a bid.
          </p>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="pb-price"
            >
              Bid Price ($)
            </label>
            <input
              id="pb-price"
              type="number"
              required
              min="0.01"
              step="0.01"
              value={price}
              onChange={e => setPrice(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-background"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedUserId}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Placing…' : 'Place Bid'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
