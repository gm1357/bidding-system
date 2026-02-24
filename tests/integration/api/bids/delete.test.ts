import { waitForServer } from '@/tests/test-helpers';

const BASE_URL = 'http://localhost:3000';

let userId: string;
let collectionId: string;
let bidId: string;

beforeAll(async () => {
  await waitForServer();

  const usersRes = await fetch(`${BASE_URL}/api/users`);
  const users = await usersRes.json();
  userId = users[0].id;

  const collectionRes = await fetch(`${BASE_URL}/api/collections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Bid Delete Test Collection',
      description: 'Test collection for bid delete tests',
      stock: 10,
      price: 5000,
    }),
  });
  const collection = await collectionRes.json();
  collectionId = collection.id;

  const bidRes = await fetch(
    `${BASE_URL}/api/collections/${collectionId}/bid`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, price: 1000 }),
    },
  );
  const bid = await bidRes.json();
  bidId = bid.id;
});

afterAll(async () => {
  if (collectionId) {
    await fetch(`${BASE_URL}/api/collections/${collectionId}`, {
      method: 'DELETE',
    });
  }
});

describe('DELETE /api/bids/:id', () => {
  it('Should return 204 and empty body on first DELETE', async () => {
    const res = await fetch(`${BASE_URL}/api/bids/${bidId}`, {
      method: 'DELETE',
    });

    expect(res.status).toBe(204);
    const text = await res.text();
    expect(text).toBe('');
  });

  it('Should return 404 on second DELETE (already soft-deleted)', async () => {
    const res = await fetch(`${BASE_URL}/api/bids/${bidId}`, {
      method: 'DELETE',
    });

    expect(res.status).toBe(404);
  });

  it('Should return 404 for non-existent UUID', async () => {
    const res = await fetch(
      `${BASE_URL}/api/bids/00000000-0000-0000-0000-000000000000`,
      { method: 'DELETE' },
    );

    expect(res.status).toBe(404);
  });

  it('Should return 409 when bid is ACCEPTED', async () => {
    const bidRes = await fetch(
      `${BASE_URL}/api/collections/${collectionId}/bid`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, price: 500 }),
      },
    );
    const bid = await bidRes.json();

    await fetch(`${BASE_URL}/api/bids/${bid.id}/accept`, { method: 'POST' });

    const res = await fetch(`${BASE_URL}/api/bids/${bid.id}`, {
      method: 'DELETE',
    });

    expect(res.status).toBe(409);
  });

  it('Should return 409 when bid is REJECTED', async () => {
    const bidRes = await fetch(
      `${BASE_URL}/api/collections/${collectionId}/bid`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, price: 500 }),
      },
    );
    const bid = await bidRes.json();

    await fetch(`${BASE_URL}/api/bids/${bid.id}/reject`, { method: 'POST' });

    const res = await fetch(`${BASE_URL}/api/bids/${bid.id}`, {
      method: 'DELETE',
    });

    expect(res.status).toBe(409);
  });
});
