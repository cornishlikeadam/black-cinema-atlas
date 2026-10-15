import test from 'node:test';
import assert from 'node:assert/strict';
import { handleApi } from '../service.mjs';

const origin = 'https://atlas.example';
const request = (path, method = 'GET', body) => new Request(origin + path, {
  method,
  headers: {
    Origin: origin,
    'Content-Type': 'application/json'
  },
  ...(body !== undefined ? { body: JSON.stringify(body) } : {})
});

test('shop API lists all artifacts and categories', async () => {
  const env = {};
  const res = await handleApi(request('/api/shop'), env);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.items.length >= 10);
  assert.ok(data.categories.length >= 5);
  assert.ok(data.items.some(i => i.id === 'bedstuy-heatwave-poster'));
  assert.ok(data.items.some(i => i.id === 'love-jones-sanctuary-print'));
});

test('shop API filters items by category and search query', async () => {
  const env = {};
  const artRes = await handleApi(request('/api/shop?category=art-prints'), env);
  const artData = await artRes.json();
  assert.ok(artData.items.length > 0);
  assert.ok(artData.items.every(i => i.category === 'art-prints'));

  const searchRes = await handleApi(request('/api/shop?q=chicago'), env);
  const searchData = await searchRes.json();
  assert.ok(searchData.items.length > 0);
  assert.ok(searchData.items.some(i => i.title.includes('Chicago') || i.artistLocation.includes('Chicago')));
});

test('shop API retrieves individual item by ID', async () => {
  const env = {};
  const res = await handleApi(request('/api/shop/bedstuy-heatwave-poster'), env);
  assert.equal(res.status, 200);
  const item = await res.json();
  assert.equal(item.id, 'bedstuy-heatwave-poster');
  assert.equal(item.artist, 'Malik Adebayo');
  assert.equal(item.price, 48.00);

  const missingRes = await handleApi(request('/api/shop/non-existent-artifact'), env);
  assert.equal(missingRes.status, 404);
});
