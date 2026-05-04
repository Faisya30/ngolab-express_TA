import dotenv from 'dotenv';

dotenv.config();

const baseUrl = String(process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 4000}`).replace(/\/$/, '');
const username = String(process.env.SMOKE_ADMIN_USERNAME || process.env.SEED_ADMIN_USERNAME || 'admin');
const password = String(process.env.SMOKE_ADMIN_PASSWORD || process.env.SEED_ADMIN_PASSWORD || '123');
const roleHeader = String(process.env.SMOKE_ADMIN_ROLE || 'Super Admin');
const testProductId = `SMOKE-${Date.now()}`;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  let body = null;

  try {
    body = await response.json();
  } catch {
    body = null;
  }

  return { response, body };
}

async function run() {
  console.log(`Running smoke test against ${baseUrl}`);

  const health = await request('/health');
  assert(health.response.ok, `Health check failed (${health.response.status})`);

  const login = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  assert(login.response.ok, `Login failed (${login.response.status}): ${login.body?.error || 'unknown error'}`);

  const listProducts = await request('/api/admin/products', {
    headers: { 'x-admin-role': roleHeader },
  });
  assert(listProducts.response.ok, `List products failed (${listProducts.response.status})`);

  const listCategories = await request('/api/admin/categories', {
    headers: { 'x-admin-role': roleHeader },
  });
  assert(listCategories.response.ok, `List categories failed (${listCategories.response.status})`);

  const categories = Array.isArray(listCategories.body) ? listCategories.body : (listCategories.body?.categories || []);
  const kioskCategory = categories.find(c => c.productType === 'kiosk');
  const categoryId = kioskCategory ? String(kioskCategory.id || '') : '';
  assert(Boolean(categoryId), 'No kiosk categories found; cannot run product create smoke test.');

  const createProduct = await request('/api/admin/products', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-admin-role': roleHeader,
    },
    body: JSON.stringify({
      product: {
        id: testProductId,
        name: 'Smoke Test Product',
        category: categoryId,
        price: 1000,
        image: '',
        description: 'Created by smoke test',
        product_type: 'kiosk',
        isRecommended: false,
        cashbackReward: 0,
      },
    }),
  });
  assert(createProduct.response.ok, `Create product failed (${createProduct.response.status}): ${createProduct.body?.error || 'unknown error'}`);

  const deleteProduct = await request(`/api/admin/products/${encodeURIComponent(testProductId)}`, {
    method: 'DELETE',
    headers: { 'x-admin-role': roleHeader },
  });
  assert(deleteProduct.response.ok, `Delete product failed (${deleteProduct.response.status})`);

  console.log('Smoke test passed: health, login, list products, create product, delete product.');
}

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
