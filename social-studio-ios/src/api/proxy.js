// Central config for all backend calls.
// Change BASE_URL here to switch environments.

export const BASE_URL = 'https://social-studio-proxy.onrender.com';

export async function proxyFetch(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  return res;
}
