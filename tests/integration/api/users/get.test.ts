import { waitForServer } from '@/tests/test-helpers';

beforeAll(async () => {
  await waitForServer();
});

describe('GET /api/users', () => {
  it('Should return 200 and an array of users', async () => {
    const res = await fetch('http://localhost:3000/api/users');
    const resBody = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(resBody)).toBe(true);
  });

  it('Should return users with id, name, and email fields', async () => {
    const res = await fetch('http://localhost:3000/api/users');
    const resBody = await res.json();

    expect(resBody.length).toBeGreaterThan(0);
    const user = resBody[0];
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('name');
    expect(user).toHaveProperty('email');
  });

  it('Should return at least 10 users', async () => {
    const res = await fetch('http://localhost:3000/api/users');
    const resBody = await res.json();

    expect(resBody.length).toBeGreaterThanOrEqual(10);
  });
});
