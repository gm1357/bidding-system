import { waitForServer } from '@/tests/test-helpers';

const BASE_URL = 'http://localhost:3000';

let userId: string;
let collectionId: string;

async function createBid(price = 1000) {
  const res = await fetch(`${BASE_URL}/api/collections/${collectionId}/bid`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, price }),
  });
  return res.json();
}

beforeAll(async () => {
  await waitForServer();

  const usersRes = await fetch(`${BASE_URL}/api/users`);
  const users = await usersRes.json();
  userId = users[0].id;

  const collectionRes = await fetch(`${BASE_URL}/api/collections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Bid Reject Test Collection',
      description: 'Test collection for bid reject tests',
      stock: 10,
      price: 5000,
    }),
  });
  const collection = await collectionRes.json();
  collectionId = collection.id;
});

afterAll(async () => {
  if (collectionId) {
    await fetch(`${BASE_URL}/api/collections/${collectionId}`, {
      method: 'DELETE',
    });
  }
});

describe('POST /api/bids/:id/reject', () => {
  it('Should return 200 and bid with status REJECTED when bid is PENDING', async () => {
    const bid = await createBid(1000);

    const res = await fetch(`${BASE_URL}/api/bids/${bid.id}/reject`, {
      method: 'POST',
    });
    const resBody = await res.json();

    expect(res.status).toBe(200);
    expect(resBody.status).toBe('REJECTED');
    expect(resBody.id).toBe(bid.id);
  });

  it('Should return 409 when bid is already REJECTED', async () => {
    const bid = await createBid(1000);

    await fetch(`${BASE_URL}/api/bids/${bid.id}/reject`, { method: 'POST' });
    const res = await fetch(`${BASE_URL}/api/bids/${bid.id}/reject`, {
      method: 'POST',
    });

    expect(res.status).toBe(409);
  });

  it('Should return 409 when bid is ACCEPTED', async () => {
    const bid = await createBid(1000);

    await fetch(`${BASE_URL}/api/bids/${bid.id}/accept`, { method: 'POST' });
    const res = await fetch(`${BASE_URL}/api/bids/${bid.id}/reject`, {
      method: 'POST',
    });

    expect(res.status).toBe(409);
  });

  it('Should return 404 for non-existent UUID', async () => {
    const res = await fetch(
      `${BASE_URL}/api/bids/00000000-0000-0000-0000-000000000000/reject`,
      { method: 'POST' },
    );

    expect(res.status).toBe(404);
  });

  it('Should return 404 for soft-deleted bid', async () => {
    const bid = await createBid(1000);
    await fetch(`${BASE_URL}/api/bids/${bid.id}`, { method: 'DELETE' });

    const res = await fetch(`${BASE_URL}/api/bids/${bid.id}/reject`, {
      method: 'POST',
    });

    expect(res.status).toBe(404);
  });
});
