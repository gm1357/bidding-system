import retry from 'async-retry';

export async function waitForServer() {
  return retry(fetchStatusPage, {
    retries: 100,
    maxTimeout: 1000,
  });

  async function fetchStatusPage() {
    const response = await fetch('http://localhost:3000/api/status');

    if (!response.ok) {
      throw new Error();
    }
  }
}
