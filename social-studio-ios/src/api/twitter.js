// X API calls — ported from index.html fetchXSearch().
// Bearer token passed as URL param (some hosts strip Authorization headers).

import { BASE_URL } from './proxy';

export async function fetchXSearch(query, bearerToken, maxResults = 5, startTime = null) {
  if (!bearerToken) {
    throw new Error('No bearer token — check that /check-password returned one and SecureStore saved it');
  }
  console.log('[Twitter] fetchXSearch query=%s token_length=%d', query.slice(0, 40), bearerToken.length);
  const params = new URLSearchParams({
    query: query + ' -is:retweet -is:reply lang:en',
    max_results: Math.max(10, maxResults),
    'tweet.fields': 'created_at,public_metrics,author_id,attachments,entities',
    expansions: 'author_id,attachments.media_keys',
    'media.fields': 'type,url,preview_image_url,variants',
    'user.fields': 'name,username',
  });
  if (startTime) params.set('start_time', startTime);
  params.set('bearer_token', bearerToken);

  const res = await fetch(`${BASE_URL}/2/tweets/search/recent?${params.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `X API error ${res.status}`);
  }
  const data = await res.json();
  if (data.errors) throw new Error(data.errors[0].message);
  return data;
}

// Returns ISO timestamp for N hours ago — used to bound X API search.
export function hoursAgo(n) {
  return new Date(Date.now() - n * 60 * 60 * 1000).toISOString();
}
