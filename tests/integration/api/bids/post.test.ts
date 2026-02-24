import { waitForServer } from '@/tests/test-helpers';

const BASE_URL = 'http://localhost:3000';

let userId: string;
let collectionId: string;

beforeAll(async () => {
  await waitForServer();

  const usersRes = await fetch(`${BASE_URL}/api/users`);
  const users = await usersRes.json();
  userId = users[0].id;

  const collectionRes = await fetch(`${BASE_URL}/api/collections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Bid Post Test Collection',
      description: 'Test collection for bid post tests',
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

describe('POST /api/collections/:id/bid', () => {
  it('Should return 201 and bid body with status PENDING when valid', async () => {
    const res = await fetch(`${BASE_URL}/api/collections/${collectionId}/bid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, price: 1000 }),
    });
    const resBody = await res.json();

    expect(res.status).toBe(201);
    expect(resBody.status).toBe('PENDING');
    expect(resBody.deletedAt).toBeNull();
    expect(resBody.collectionId).toBe(collectionId);
    expect(resBody.userId).toBe(userId);
    expect(resBody.price).toBe(1000);
  });

  it('Should return 400 when userId is missing', async () => {
    const res = await fetch(`${BASE_URL}/api/collections/${collectionId}/bid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price: 1000 }),
    });

    expect(res.status).toBe(400);
  });

  it('Should return 400 when userId is an empty string', async () => {
    const res = await fetch(`${BASE_URL}/api/collections/${collectionId}/bid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: '', price: 1000 }),
    });

    expect(res.status).toBe(400);
  });

  it('Should return 400 when price is missing', async () => {
    const res = await fetch(`${BASE_URL}/api/collections/${collectionId}/bid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });

    expect(res.status).toBe(400);
  });

  it('Should return 400 when price is negative', async () => {
    const res = await fetch(`${BASE_URL}/api/collections/${collectionId}/bid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, price: -1 }),
    });

    expect(res.status).toBe(400);
  });

  it('Should return 400 when price is not an integer', async () => {
    const res = await fetch(`${BASE_URL}/api/collections/${collectionId}/bid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, price: 3.5 }),
    });

    expect(res.status).toBe(400);
  });

  it('Should return 400 when body is invalid JSON', async () => {
    const res = await fetch(`${BASE_URL}/api/collections/${collectionId}/bid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    });

    expect(res.status).toBe(400);
  });

  it('Should return 400 when userId does not exist in DB', async () => {
    const res = await fetch(`${BASE_URL}/api/collections/${collectionId}/bid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: '00000000-0000-0000-0000-000000000000',
        price: 1000,
      }),
    });

    expect(res.status).toBe(400);
  });

  it('Should return 404 when collectionId does not exist', async () => {
    const res = await fetch(
      `${BASE_URL}/api/collections/00000000-0000-0000-0000-000000000000/bid`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, price: 1000 }),
      },
    );

    expect(res.status).toBe(404);
  });

  it('Should return 404 when collection is soft-deleted', async () => {
    const createRes = await fetch(`${BASE_URL}/api/collections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Deleted Collection',
        description: 'Will be deleted',
        stock: 1,
        price: 100,
      }),
    });
    const created = await createRes.json();

    await fetch(`${BASE_URL}/api/collections/${created.id}`, {
      method: 'DELETE',
    });

    const res = await fetch(`${BASE_URL}/api/collections/${created.id}/bid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, price: 1000 }),
    });

    expect(res.status).toBe(404);
  });
});
