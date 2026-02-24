import { waitForServer } from '@/tests/test-helpers';

const BASE_URL = 'http://localhost:3000';

let userId: string;

beforeAll(async () => {
  await waitForServer();

  const usersRes = await fetch(`${BASE_URL}/api/users`);
  const users = await usersRes.json();
  userId = users[0].id;
});

describe('GET /api/collections', () => {
  it('Should return the first page of collections when no pagination params are provided', async () => {
    const res = await fetch(`http://localhost:3000/api/collections`);
    const resBody = await res.json();

    expect(res.status).toBe(200);
    expect(resBody).toEqual({
      data: resBody.data,
      page: 1,
      pageSize: 10,
      total: resBody.total,
      totalPages: resBody.totalPages,
    });
  });

  it('Should return the second page of collections when page and pageSize params are provided', async () => {
    const res = await fetch(
      `http://localhost:3000/api/collections?page=2&pageSize=5`,
    );
    const resBody = await res.json();

    expect(res.status).toBe(200);
    expect(resBody).toEqual({
      data: resBody.data,
      page: 2,
      pageSize: 5,
      total: resBody.total,
      totalPages: resBody.totalPages,
    });
  });

  it('Should return the empty array when the page is out of range', async () => {
    const res = await fetch(
      `http://localhost:3000/api/collections?page=2&pageSize=100`,
    );
    const resBody = await res.json();

    expect(res.status).toBe(200);
    expect(resBody).toEqual({
      data: [],
      page: 2,
      pageSize: 100,
      total: resBody.total,
      totalPages: resBody.totalPages,
    });
  });

  it('Should return the first page of collections when page is less than 1', async () => {
    const res = await fetch(`http://localhost:3000/api/collections?page=0`);
    const resBody = await res.json();

    expect(res.status).toBe(200);
    expect(resBody).toEqual({
      data: resBody.data,
      page: 1,
      pageSize: 10,
      total: resBody.total,
      totalPages: resBody.totalPages,
    });
  });

  it('Should return with 1 as pageSize when pageSize is less than 1', async () => {
    const res = await fetch(`http://localhost:3000/api/collections?pageSize=0`);
    const resBody = await res.json();

    expect(res.status).toBe(200);
    expect(resBody).toEqual({
      data: resBody.data,
      page: 1,
      pageSize: 1,
      total: resBody.total,
      totalPages: resBody.totalPages,
    });
  });

  it('Should return max 100 as pageSize when pageSize is greater than 100', async () => {
    const res = await fetch(
      `http://localhost:3000/api/collections?pageSize=101`,
    );
    const resBody = await res.json();

    expect(res.status).toBe(200);
    expect(resBody).toEqual({
      data: resBody.data,
      page: 1,
      pageSize: 100,
      total: resBody.total,
      totalPages: resBody.totalPages,
    });
  });

  it('Should return only non-deleted collections', async () => {
    const resBefore = await fetch(`http://localhost:3000/api/collections`);
    const resBodyBefore = await resBefore.json();

    const resCreate = await fetch(`http://localhost:3000/api/collections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Deleted Collection',
        description: 'A deleted collection',
        stock: 10,
        price: 1999,
      }),
    });
    const resBodyCreate = await resCreate.json();
    await fetch(`http://localhost:3000/api/collections/${resBodyCreate.id}`, {
      method: 'DELETE',
    });
    const resAfter = await fetch(`http://localhost:3000/api/collections`);
    const resBodyAfter = await resAfter.json();

    expect(resAfter.status).toBe(200);
    expect(resBodyAfter).toEqual({
      data: resBodyBefore.data,
      page: 1,
      pageSize: 10,
      total: resBodyBefore.total,
      totalPages: resBodyBefore.totalPages,
    });
  });

  it('Should include a bids array on each collection', async () => {
    const res = await fetch(`${BASE_URL}/api/collections`);
    const resBody = await res.json();

    expect(res.status).toBe(200);
    expect(resBody.data.length).toBeGreaterThan(0);
    resBody.data.forEach((collection: { bids: unknown }) => {
      expect(Array.isArray(collection.bids)).toBe(true);
    });
  });

  it('Should exclude soft-deleted bids from the bids array', async () => {
    const collectionRes = await fetch(`${BASE_URL}/api/collections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bids Filter Test Collection',
        description: 'Test for bid filtering',
        stock: 5,
        price: 2000,
      }),
    });
    const collection = await collectionRes.json();

    const bidRes = await fetch(
      `${BASE_URL}/api/collections/${collection.id}/bid`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, price: 500 }),
      },
    );
    const bid = await bidRes.json();

    await fetch(`${BASE_URL}/api/bids/${bid.id}`, { method: 'DELETE' });

    const res = await fetch(`${BASE_URL}/api/collections?pageSize=100&page=1`);
    const resBody = await res.json();

    const found = resBody.data.find(
      (c: { id: string }) => c.id === collection.id,
    );

    // Clean up
    await fetch(`${BASE_URL}/api/collections/${collection.id}`, {
      method: 'DELETE',
    });

    expect(found).toBeDefined();
    expect(
      (found as { bids: { id: string }[] }).bids.find(
        (b: { id: string }) => b.id === bid.id,
      ),
    ).toBeUndefined();
  });
});
