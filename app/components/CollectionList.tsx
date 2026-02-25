import { useEffect, useRef } from 'react';
import type { User } from '@/prisma/generated/prisma/client';
import type { CollectionWithBids } from '@/lib/types';
import CollectionRow from './CollectionRow';

interface CollectionListProps {
  collections: CollectionWithBids[];
  users: User[];
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  onPlaceBid: (collectionId: string) => void;
  onMutated: () => void;
}

export default function CollectionList({
  collections,
  users,
  hasMore,
  isLoading,
  onLoadMore,
  onPlaceBid,
  onMutated,
}: CollectionListProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) onLoadMore();
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [onLoadMore]);

  return (
    <div className="flex flex-col gap-3">
      {collections.map(collection => (
        <CollectionRow
          key={collection.id}
          collection={collection}
          users={users}
          onPlaceBid={() => onPlaceBid(collection.id)}
          onMutated={onMutated}
        />
      ))}

      {isLoading && (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
          Loading…
        </p>
      )}

      {hasMore && !isLoading && (
        <div ref={sentinelRef} className="h-4" aria-hidden="true" />
      )}

      {!hasMore && collections.length > 0 && (
        <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-4">
          No more collections
        </p>
      )}

      {!hasMore && collections.length === 0 && !isLoading && (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">
          No collections found.
        </p>
      )}
    </div>
  );
}
