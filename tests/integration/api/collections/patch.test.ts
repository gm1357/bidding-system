import { waitForServer } from '@/tests/test-helpers';

const BASE_URL = 'http://localhost:3000/api/collections';

const validBody = {
  name: 'Patch Test Collection',
  description: 'A collection for PATCH tests',
  stock: 5,
  price: 999,
};

let createdId: string;

beforeAll(async () => {
  await waitForServer();

  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validBody),
  });
  const resBody = await res.json();
  createdId = resBody.id;
});

afterAll(async () => {
  if (createdId) {
    await fetch(`${BASE_URL}/${createdId}`, { method: 'DELETE' });
  }
});

describe('PATCH /api/collections/:id', () => {
  it('Should return 200 and the updated record when name is updated', async () => {
    const res = await fetch(`${BASE_URL}/${createdId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated Name' }),
    });
    const resBody = await res.json();

    expect(res.status).toBe(200);
    expect(resBody.name).toBe('Updated Name');
    expect(resBody.description).toBe(validBody.description);
    expect(resBody.stock).toBe(validBody.stock);
    expect(resBody.price).toBe(validBody.price);
  });

  it('Should return 200 and the updated record when multiple fields are updated', async () => {
    const res = await fetch(`${BASE_URL}/${createdId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock: 20, price: 4999 }),
    });
    const resBody = await res.json();

    expect(res.status).toBe(200);
    expect(resBody.stock).toBe(20);
    expect(resBody.price).toBe(4999);
  });

  it('Should return 400 when body is empty object', async () => {
    const res = await fetch(`${BASE_URL}/${createdId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const resBody = await res.json();

    expect(res.status).toBe(400);
    expect(resBody).toHaveProperty('error');
  });

  it('Should return 400 when a field has wrong type', async () => {
    const res = await fetch(`${BASE_URL}/${createdId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock: 'lots' }),
    });
    const resBody = await res.json();

    expect(res.status).toBe(400);
    expect(resBody).toHaveProperty('error');
  });

  it('Should return 404 for a non-existent UUID', async () => {
    const res = await fetch(
      `${BASE_URL}/00000000-0000-0000-0000-000000000000`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Ghost' }),
      },
    );
    const resBody = await res.json();

    expect(res.status).toBe(404);
    expect(resBody).toHaveProperty('error');
  });

  it('Should return 404 for a soft-deleted record', async () => {
    const createRes = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'To Be Deleted',
        description: 'Soft delete test',
        stock: 1,
        price: 100,
      }),
    });
    const created = await createRes.json();
    const softDeletedId = created.id;

    await fetch(`${BASE_URL}/${softDeletedId}`, { method: 'DELETE' });

    const res = await fetch(`${BASE_URL}/${softDeletedId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated After Delete' }),
    });
    const resBody = await res.json();

    expect(res.status).toBe(404);
    expect(resBody).toHaveProperty('error');
  });
});
