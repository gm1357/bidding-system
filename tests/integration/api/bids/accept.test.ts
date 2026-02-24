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
      name: 'Bid Accept Test Collection',
      description: 'Test collection for bid accept tests',
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

describe('POST /api/bids/:id/accept', () => {
  it('Should return 200 and bid with status ACCEPTED when bid is PENDING', async () => {
    const bid = await createBid(1000);

    const res = await fetch(`${BASE_URL}/api/bids/${bid.id}/accept`, {
      method: 'POST',
    });
    const resBody = await res.json();

    expect(res.status).toBe(200);
    expect(resBody.status).toBe('ACCEPTED');
    expect(resBody.id).toBe(bid.id);
  });

  it('Should set other PENDING bids to REJECTED when a bid is accepted', async () => {
    const bid1 = await createBid(1000);
    const bid2 = await createBid(1500);

    await fetch(`${BASE_URL}/api/bids/${bid1.id}/accept`, { method: 'POST' });

    const bid2Res = await fetch(`${BASE_URL}/api/bids/${bid2.id}`);
    const bid2Body = await bid2Res.json();

    expect(bid2Body.status).toBe('REJECTED');
  });

  it('Should return 409 when bid is already ACCEPTED', async () => {
    const bid = await createBid(1000);

    await fetch(`${BASE_URL}/api/bids/${bid.id}/accept`, { method: 'POST' });
    const res = await fetch(`${BASE_URL}/api/bids/${bid.id}/accept`, {
      method: 'POST',
    });

    expect(res.status).toBe(409);
  });

  it('Should return 409 when bid is REJECTED', async () => {
    const bid = await createBid(1000);

    await fetch(`${BASE_URL}/api/bids/${bid.id}/reject`, { method: 'POST' });
    const res = await fetch(`${BASE_URL}/api/bids/${bid.id}/accept`, {
      method: 'POST',
    });

    expect(res.status).toBe(409);
  });

  it('Should return 404 for non-existent UUID', async () => {
    const res = await fetch(
      `${BASE_URL}/api/bids/00000000-0000-0000-0000-000000000000/accept`,
      { method: 'POST' },
    );

    expect(res.status).toBe(404);
  });

  it('Should return 404 for soft-deleted bid', async () => {
    const bid = await createBid(1000);
    await fetch(`${BASE_URL}/api/bids/${bid.id}`, { method: 'DELETE' });

    const res = await fetch(`${BASE_URL}/api/bids/${bid.id}/accept`, {
      method: 'POST',
    });

    expect(res.status).toBe(404);
  });
});
