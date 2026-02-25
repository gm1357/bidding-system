import { useEffect, useState } from 'react';

interface CreateCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateCollectionModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateCollectionModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [stock, setStock] = useState('');
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

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const cents = Math.round(parseFloat(price) * 100);
    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          stock: parseInt(stock, 10),
          price: cents,
        }),
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
        aria-labelledby="create-collection-title"
        className="bg-background rounded-lg p-6 w-full max-w-md shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <h2 id="create-collection-title" className="text-lg font-semibold mb-4">
          Create Collection
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="cc-name">
              Name
            </label>
            <input
              id="cc-name"
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-background"
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="cc-description"
            >
              Description
            </label>
            <textarea
              id="cc-description"
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-background resize-none"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label
                className="block text-sm font-medium mb-1"
                htmlFor="cc-stock"
              >
                Stock
              </label>
              <input
                id="cc-stock"
                type="number"
                required
                min="1"
                step="1"
                value={stock}
                onChange={e => setStock(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-background"
              />
            </div>
            <div className="flex-1">
              <label
                className="block text-sm font-medium mb-1"
                htmlFor="cc-price"
              >
                Price ($)
              </label>
              <input
                id="cc-price"
                type="number"
                required
                min="0.01"
                step="0.01"
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-background"
              />
            </div>
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
              disabled={isSubmitting}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
