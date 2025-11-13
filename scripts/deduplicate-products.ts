/*
 * Deduplicate products based on case-insensitive product_name.
 * Usage: npx ts-node scripts/deduplicate-products.ts
 */

import fs from 'fs';
import path from 'path';

interface ProductRecord {
  [key: string]: any;
  product_name?: string;
}

interface DuplicateGroupReport {
  productName: string;
  keptProduct: ProductRecord;
  removedProducts: ProductRecord[];
}

const CANDIDATE_FILENAMES = [
  'data/products.json',
  'data/Products.json',
  'data/products-data.json',
  'data/Products-data.json',
  'data/products_data.json',
  'data/Products Data.json',
];

function findProductsFile(): string {
  for (const file of CANDIDATE_FILENAMES) {
    const absolute = path.resolve(file);
    if (fs.existsSync(absolute)) {
      return absolute;
    }
  }
  throw new Error('Could not locate products data file. Checked: ' + CANDIDATE_FILENAMES.join(', '));
}

function normalizeName(name: string | undefined): string {
  return (name ?? '').trim().toLowerCase();
}

function completenessScore(product: ProductRecord): number {
  // count non-null, non-empty fields
  return Object.entries(product).reduce((score, [, value]) => {
    if (value === null || value === undefined) {
      return score;
    }
    if (typeof value === 'string' && value.trim().length === 0) {
      return score;
    }
    return score + 1;
  }, 0);
}

function hasImage(product: ProductRecord): boolean {
  const imageFields = ['image', 'image_url', 'imageUrl'];
  return imageFields.some((field) => {
    const value = product[field];
    return typeof value === 'string' && value.trim().length > 0;
  });
}

function selectBestProduct(products: ProductRecord[]): ProductRecord {
  const scored = products.map((product, index) => ({
    product,
    index,
    imagePriority: hasImage(product) ? 1 : 0,
    score: completenessScore(product),
  }));

  scored.sort((a, b) => {
    if (b.imagePriority !== a.imagePriority) return b.imagePriority - a.imagePriority;
    if (b.score !== a.score) return b.score - a.score;
    return a.index - b.index; // keep first occurrence on tie
  });

  return scored[0].product;
}

function run() {
  const filePath = findProductsFile();
  const originalContent = fs.readFileSync(filePath, 'utf-8');
  const originalSize = Buffer.byteLength(originalContent, 'utf-8');

  let data: unknown;
  try {
    data = JSON.parse(originalContent);
  } catch (error) {
    throw new Error(`Failed to parse JSON from ${filePath}: ${(error as Error).message}`);
  }

  if (!Array.isArray(data)) {
    throw new Error(`Expected an array of products in ${filePath}`);
  }

  const totalBefore = data.length;

  const groups = new Map<string, ProductRecord[]>();
  data.forEach((entry) => {
    const product = entry as ProductRecord;
    const key = normalizeName(product.product_name);
    if (!key) return;

    const list = groups.get(key) ?? [];
    list.push(product);
    groups.set(key, list);
  });

  const deduplicated: ProductRecord[] = [];
  const reports: DuplicateGroupReport[] = [];

  groups.forEach((products, key) => {
    if (products.length === 1) {
      deduplicated.push(products[0]);
      return;
    }

    const best = selectBestProduct(products);
    const removed = products.filter((product) => product !== best);

    deduplicated.push(best);
    reports.push({
      productName: key,
      keptProduct: best,
      removedProducts: removed,
    });
  });

  // Ensure we include entries without a product_name or duplicates detected.
  const uniqueSet = new Set<ProductRecord>(deduplicated);
  data.forEach((product) => {
    if (!product || typeof product !== 'object') return;
    if (!('product_name' in product) || normalizeName((product as ProductRecord).product_name) === '') {
      if (!uniqueSet.has(product as ProductRecord)) {
        deduplicated.push(product as ProductRecord);
        uniqueSet.add(product as ProductRecord);
      }
    }
  });

  const totalAfter = deduplicated.length;
  const productsRemoved = totalBefore - totalAfter;
  const duplicateGroups = reports.length;

  const outputPath = path.resolve(path.dirname(filePath), 'Products Data.deduped.json');
  const dedupContent = JSON.stringify(deduplicated, null, 2);
  fs.writeFileSync(outputPath, dedupContent + '\n', 'utf-8');
  const dedupSize = Buffer.byteLength(dedupContent, 'utf-8');

  const spaceSavedBytes = Math.max(0, originalSize - dedupSize);
  const spaceSavedKB = (spaceSavedBytes / 1024).toFixed(2);

  // Build report message
  const reportLines: string[] = [];
  reportLines.push('=== Product Deduplication Report ===');
  reportLines.push(`Source file: ${filePath}`);
  reportLines.push(`Output file: ${outputPath}`);
  reportLines.push(`Total products before: ${totalBefore}`);
  reportLines.push(`Duplicate groups found: ${duplicateGroups}`);
  reportLines.push(`Products removed: ${productsRemoved}`);
  reportLines.push(`Total products after: ${totalAfter}`);
  reportLines.push(`Space saved: ${spaceSavedBytes} bytes (~${spaceSavedKB} KB)`);
  reportLines.push('');

  if (reports.length > 0) {
    reportLines.push('Sample duplicate groups:');
    reports.slice(0, 5).forEach((group, index) => {
      reportLines.push(`  ${index + 1}. ${group.productName}`);
      reportLines.push(`     Kept: ${(group.keptProduct.product_name ?? '').toString()}`);
      const removedNames = group.removedProducts.map((p) => p.product_name ?? '(unnamed)');
      reportLines.push(`     Removed: ${removedNames.join(', ')}`);
    });
  } else {
    reportLines.push('No duplicate groups detected.');
  }

  console.log(reportLines.join('\n'));
}

run();
