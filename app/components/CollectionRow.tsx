import type { User } from '@/prisma/generated/prisma/client';
import type { CollectionWithBids } from '@/lib/types';
import BidRow from './BidRow';

interface CollectionRowProps {
  collection: CollectionWithBids;
  users: User[];
  onPlaceBid: () => void;
  onMutated: () => void;
}

export default function CollectionRow({
  collection,
  users,
  onPlaceBid,
  onMutated,
}: CollectionRowProps) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-semibold text-base truncate">
            {collection.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
            {collection.description}
          </p>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
            <span>
              Stock:{' '}
              <span className="font-medium text-foreground">
                {collection.stock}
              </span>
            </span>
            <span>
              Price:{' '}
              <span className="font-medium text-foreground">
                ${(collection.price / 100).toFixed(2)}
              </span>
            </span>
          </div>
        </div>
        <button
          onClick={onPlaceBid}
          className="shrink-0 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Place Bid
        </button>
      </div>

      {collection.bids.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
            Bids ({collection.bids.length})
          </p>
          {collection.bids.map(bid => (
            <BidRow
              key={bid.id}
              bid={bid}
              users={users}
              onMutated={onMutated}
            />
          ))}
        </div>
      )}
    </div>
  );
}
