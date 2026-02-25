'use client';

import { useState, useEffect, useCallback } from 'react';
import type { User } from '@/prisma/generated/prisma/client';
import type { CollectionWithBids, PaginatedResponse } from '@/lib/types';
import Header from './components/Header';
import CollectionList from './components/CollectionList';
import CreateCollectionModal from './components/CreateCollectionModal';
import PlaceBidModal from './components/PlaceBidModal';

export default function HomePage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [collections, setCollections] = useState<CollectionWithBids[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [pendingBidCollectionId, setPendingBidCollectionId] = useState<
    string | null
  >(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    const res = await fetch(`/api/collections?page=${page}&pageSize=10`);
    const body: PaginatedResponse<CollectionWithBids> = await res.json();
    setCollections(prev => [...prev, ...body.data]);
    setPage(prev => prev + 1);
    setHasMore(body.page < body.totalPages);
    setIsLoading(false);
  }, [isLoading, hasMore, page]);

  const resetAndRefetch = useCallback(async () => {
    setIsLoading(true);
    const res = await fetch('/api/collections?page=1&pageSize=10');
    const body: PaginatedResponse<CollectionWithBids> = await res.json();
    setCollections(body.data);
    setPage(2);
    setHasMore(1 < body.totalPages);
    setIsLoading(false);
  }, []);

  // Fetch users once on mount
  useEffect(() => {
    fetch('/api/users')
      .then(r => r.json())
      .then(body => {
        console.log(body);
        setUsers(body ?? []);
      })
      .catch(() => {});
  }, []);

  // Fetch first page on mount
  useEffect(() => {
    loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pendingBidCollection = pendingBidCollectionId
    ? collections.find(c => c.id === pendingBidCollectionId)
    : null;

  return (
    <>
      <Header
        users={users}
        selectedUserId={selectedUserId}
        onUserChange={setSelectedUserId}
        onCreateCollection={() => setIsCreateModalOpen(true)}
      />

      <main className="max-w-5xl mx-auto px-4 py-6">
        <CollectionList
          collections={collections}
          users={users}
          hasMore={hasMore}
          isLoading={isLoading}
          onLoadMore={loadMore}
          onPlaceBid={id => setPendingBidCollectionId(id)}
          onMutated={resetAndRefetch}
        />
      </main>

      <CreateCollectionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          resetAndRefetch();
        }}
      />

      <PlaceBidModal
        isOpen={pendingBidCollectionId !== null}
        collectionId={pendingBidCollectionId}
        collectionName={pendingBidCollection?.name ?? ''}
        selectedUserId={selectedUserId}
        onClose={() => setPendingBidCollectionId(null)}
        onSuccess={() => {
          setPendingBidCollectionId(null);
          resetAndRefetch();
        }}
      />
    </>
  );
}
