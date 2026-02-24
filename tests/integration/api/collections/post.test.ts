import { waitForServer } from '@/tests/test-helpers';

const BASE_URL = 'http://localhost:3000/api/collections';

const validBody = {
  name: 'Test Collection',
  description: 'A test collection',
  stock: 10,
  price: 1999,
};

let createdId: string | null = null;

beforeAll(async () => {
  await waitForServer();
});

afterAll(async () => {
  if (createdId) {
    await fetch(`${BASE_URL}/${createdId}`, { method: 'DELETE' });
  }
});

describe('POST /api/collections', () => {
  it('Should return 201 and the created record when all fields are valid', async () => {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });
    const resBody = await res.json();

    expect(res.status).toBe(201);
    expect(resBody).toMatchObject({
      name: validBody.name,
      description: validBody.description,
      stock: validBody.stock,
      price: validBody.price,
    });
    expect(typeof resBody.id).toBe('string');
    expect(resBody.deletedAt).toBeNull();

    createdId = resBody.id;
  });

  it('Should return 400 when name is missing', async () => {
    const { name: _name, ...body } = validBody;
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const resBody = await res.json();

    expect(res.status).toBe(400);
    expect(resBody).toHaveProperty('error');
  });

  it('Should return 400 when description is missing', async () => {
    const { description: _description, ...body } = validBody;
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const resBody = await res.json();

    expect(res.status).toBe(400);
    expect(resBody).toHaveProperty('error');
  });

  it('Should return 400 when stock is missing', async () => {
    const { stock: _stock, ...body } = validBody;
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const resBody = await res.json();

    expect(res.status).toBe(400);
    expect(resBody).toHaveProperty('error');
  });

  it('Should return 400 when price is missing', async () => {
    const { price: _price, ...body } = validBody;
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const resBody = await res.json();

    expect(res.status).toBe(400);
    expect(resBody).toHaveProperty('error');
  });

  it('Should return 400 when stock is not an integer', async () => {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validBody, stock: 'abc' }),
    });
    const resBody = await res.json();

    expect(res.status).toBe(400);
    expect(resBody).toHaveProperty('error');
  });

  it('Should return 400 when price is negative', async () => {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validBody, price: -1 }),
    });
    const resBody = await res.json();

    expect(res.status).toBe(400);
    expect(resBody).toHaveProperty('error');
  });

  it('Should return 400 when body is not valid JSON', async () => {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-valid-json',
    });
    const resBody = await res.json();

    expect(res.status).toBe(400);
    expect(resBody).toHaveProperty('error');
  });
});
