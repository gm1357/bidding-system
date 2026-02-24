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
      name: 'Bid Patch Test Collection',
      description: 'Test collection for bid patch tests',
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

describe('PATCH /api/bids/:id', () => {
  it('Should return 200 and updated bid when price is updated', async () => {
    const res = await fetch(`${BASE_URL}/api/bids/${bidId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price: 2000 }),
    });
    const resBody = await res.json();

    expect(res.status).toBe(200);
    expect(resBody.price).toBe(2000);
    expect(resBody.id).toBe(bidId);
  });

  it('Should return 400 when body is empty object', async () => {
    const res = await fetch(`${BASE_URL}/api/bids/${bidId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(400);
  });

  it('Should return 400 when price is a string', async () => {
    const res = await fetch(`${BASE_URL}/api/bids/${bidId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price: 'not-a-number' }),
    });

    expect(res.status).toBe(400);
  });

  it('Should return 400 when price is negative', async () => {
    const res = await fetch(`${BASE_URL}/api/bids/${bidId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price: -100 }),
    });

    expect(res.status).toBe(400);
  });

  it('Should return 400 when body is invalid JSON', async () => {
    const res = await fetch(`${BASE_URL}/api/bids/${bidId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    });

    expect(res.status).toBe(400);
  });

  it('Should return 404 for non-existent UUID', async () => {
    const res = await fetch(
      `${BASE_URL}/api/bids/00000000-0000-0000-0000-000000000000`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: 500 }),
      },
    );

    expect(res.status).toBe(404);
  });

  it('Should return 404 for soft-deleted bid', async () => {
    const bidRes = await fetch(
      `${BASE_URL}/api/collections/${collectionId}/bid`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, price: 300 }),
      },
    );
    const bid = await bidRes.json();

    await fetch(`${BASE_URL}/api/bids/${bid.id}`, { method: 'DELETE' });

    const res = await fetch(`${BASE_URL}/api/bids/${bid.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price: 500 }),
    });

    expect(res.status).toBe(404);
  });

  it('Should return 409 when bid is ACCEPTED', async () => {
    const bidRes = await fetch(
      `${BASE_URL}/api/collections/${collectionId}/bid`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, price: 300 }),
      },
    );
    const bid = await bidRes.json();

    await fetch(`${BASE_URL}/api/bids/${bid.id}/accept`, { method: 'POST' });

    const res = await fetch(`${BASE_URL}/api/bids/${bid.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price: 500 }),
    });

    expect(res.status).toBe(409);
  });

  it('Should return 409 when bid is REJECTED', async () => {
    const bidRes = await fetch(
      `${BASE_URL}/api/collections/${collectionId}/bid`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, price: 300 }),
      },
    );
    const bid = await bidRes.json();

    await fetch(`${BASE_URL}/api/bids/${bid.id}/reject`, { method: 'POST' });

    const res = await fetch(`${BASE_URL}/api/bids/${bid.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price: 500 }),
    });

    expect(res.status).toBe(409);
  });
});
