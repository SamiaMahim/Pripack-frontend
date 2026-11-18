/* eslint-disable react/prop-types */
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

export const SITE_URL = 'https://www.pripacklab.com';
export const SITE_NAME = 'PriPackLab';
export const DEFAULT_TITLE = 'PriPackLab — Online Printing & Packaging in Bangladesh | Business Card, ID Card, Packaging';
export const DEFAULT_DESCRIPTION = 'Online printing & packaging shop in Bangladesh. Order custom business cards, ID cards, packaging boxes, stickers and branding materials from Dhaka with cash on delivery to all 64 districts.';
export const DEFAULT_IMAGE = `${SITE_URL}/assets/banner.jpg`;

// Site-wide Bangladesh search terms (English, Banglish and Bangla). Page keywords are listed first, then these.
export const BASE_KEYWORDS = [
  'printing press in Bangladesh',
  'online printing Bangladesh',
  'printing shop Dhaka',
  'packaging company in Bangladesh',
  'custom packaging Bangladesh',
  'business card printing Dhaka',
  'ID card printing Bangladesh',
  'sticker printing Dhaka',
  'printing Mirpur',
  'printing price in Bangladesh',
  'cash on delivery Bangladesh',
  'প্রিন্টিং প্রেস ঢাকা',
  'অনলাইন প্রিন্টিং বাংলাদেশ',
  'প্যাকেজিং বাংলাদেশ',
  'ভিজিটিং কার্ড প্রিন্ট',
  'বিজনেস কার্ড প্রিন্ট',
  'আইডি কার্ড প্রিন্ট',
  'PriPackLab',
];

// Search phrases Bangladeshi shoppers commonly use for a product or category name.
export const bdKeywordsFor = (name, nameBn) => {
  if (!name) return [];
  return [
    name,
    nameBn,
    `${name} price in Bangladesh`,
    `${name} price in BD`,
    `${name} printing Dhaka`,
    `${name} Bangladesh`,
    `buy ${name} online Bangladesh`,
    nameBn && `${nameBn} দাম`,
    nameBn && `${nameBn} প্রিন্ট ঢাকা`,
  ].filter(Boolean);
};

// Strips HTML tags and collapses whitespace so rich-text fields can be used as meta descriptions.
export const toMetaDescription = (html, max = 160) => {
  const text = String(html || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
};

export const absoluteUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

/**
 * Per-page head tags: title, description, keywords, canonical, Open Graph, Twitter and optional JSON-LD.
 * Pass `noindex` for private/transactional pages (cart, checkout, profile, ...).
 */
const Seo = ({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = [],
  path,
  image = DEFAULT_IMAGE,
  type = 'website',
  noindex = false,
  jsonLd,
}) => {
  const { pathname } = useLocation();
  const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
  const canonical = absoluteUrl(path ?? pathname);
  const imageUrl = absoluteUrl(image);
  const schemas = [jsonLd].flat().filter(Boolean);
  const keywordList = [...new Set([...keywords, ...BASE_KEYWORDS].filter(Boolean))].join(', ');

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywordList} />
      <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'} />
      {!noindex && <link rel="canonical" href={canonical} />}

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={imageUrl} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />

      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(schema)}</script>
      ))}
    </Helmet>
  );
};

export default Seo;
