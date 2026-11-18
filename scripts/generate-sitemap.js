// Writes dist/sitemap.xml after `vite build`, listing static pages plus every
// category, subcategory, combo and product currently returned by the API.
// If the API is unreachable the sitemap still gets the static pages.
import { writeFile } from 'node:fs/promises';
import process from 'node:process';
import { loadEnv } from 'vite';

const SITE_URL = 'https://www.pripacklab.com';
const { VITE_BASE_URL: API } = loadEnv('production', process.cwd(), 'VITE_');

const STATIC_PAGES = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/aboutus', priority: '0.5', changefreq: 'monthly' },
  { path: '/faq', priority: '0.5', changefreq: 'monthly' },
  { path: '/sellerregister', priority: '0.4', changefreq: 'monthly' },
  { path: '/privacy-policy', priority: '0.2', changefreq: 'yearly' },
  { path: '/terms-and-conditions', priority: '0.2', changefreq: 'yearly' },
];

const getJson = async (endpoint) => {
  try {
    const res = await fetch(`${API}${endpoint}`, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[sitemap] ${endpoint} failed: ${err.message}`);
    return null;
  }
};

const slugOf = (entity) => entity?.slug || entity?._id;
const isoDate = (value) => (value && !Number.isNaN(Date.parse(value)) ? new Date(value).toISOString().slice(0, 10) : null);
const escapeXml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const [products, catnsub, home] = await Promise.all([
  getJson('/getproducts'),
  getJson('/getcatnsub'),
  getJson('/gethome'),
]);

const entries = [...STATIC_PAGES];

for (const cat of catnsub?.categories || []) {
  entries.push({ path: `/categorydetails/${slugOf(cat)}`, priority: '0.8', changefreq: 'weekly' });
}
for (const sub of catnsub?.subcategories || []) {
  entries.push({ path: `/subcategorydetails/${sub._id}`, priority: '0.7', changefreq: 'weekly' });
}
for (const combo of home?.combos || []) {
  entries.push({ path: `/combo/${slugOf(combo)}`, priority: '0.7', changefreq: 'weekly', lastmod: isoDate(combo.updatedAt || combo.createdAt) });
}
for (const product of Array.isArray(products) ? products : []) {
  entries.push({ path: `/productdetails/${slugOf(product)}`, priority: '0.9', changefreq: 'weekly', lastmod: isoDate(product.updatedAt || product.createdAt) });
}

const seen = new Set();
const urls = entries
  .filter(({ path }) => !path.endsWith('/undefined') && !seen.has(path) && seen.add(path))
  .map(({ path, priority, changefreq, lastmod }) => [
    '  <url>',
    `    <loc>${escapeXml(SITE_URL + encodeURI(path))}</loc>`,
    lastmod && `    <lastmod>${lastmod}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ].filter(Boolean).join('\n'));

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;

await writeFile('dist/sitemap.xml', xml);
console.log(`[sitemap] wrote dist/sitemap.xml with ${urls.length} URLs`);
