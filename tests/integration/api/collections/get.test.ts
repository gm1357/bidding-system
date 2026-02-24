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
});
