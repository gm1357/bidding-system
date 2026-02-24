import { waitForServer } from '@/tests/test-helpers';

const BASE_URL = 'http://localhost:3000/api/collections';

const validBody = {
  name: 'Delete Test Collection',
  description: 'A collection for DELETE tests',
  stock: 3,
  price: 499,
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

describe('DELETE /api/collections/:id', () => {
  it('Should return 204 with empty body on first DELETE', async () => {
    const res = await fetch(`${BASE_URL}/${createdId}`, { method: 'DELETE' });

    expect(res.status).toBe(204);
    const text = await res.text();
    expect(text).toBe('');
  });

  it('Should return 404 on second DELETE (already soft-deleted)', async () => {
    const res = await fetch(`${BASE_URL}/${createdId}`, { method: 'DELETE' });
    const resBody = await res.json();

    expect(res.status).toBe(404);
    expect(resBody).toHaveProperty('error');
  });

  it('Should return 404 for a non-existent UUID', async () => {
    const res = await fetch(
      `${BASE_URL}/00000000-0000-0000-0000-000000000000`,
      { method: 'DELETE' },
    );
    const resBody = await res.json();

    expect(res.status).toBe(404);
    expect(resBody).toHaveProperty('error');
  });
});
