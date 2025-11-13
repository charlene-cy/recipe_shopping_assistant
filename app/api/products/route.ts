import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { WeeeProduct } from '@/src/types';

// Weee JSON 数据格式
interface WeeeRawProduct {
  category: string;
  product_name: string;
  price: number;
  unit_price: string | number;
  sales_count: number | null;
  image_url: string;
  source_url: string;
}

// 转换函数：将 Weee 原始数据转换为 WeeeProduct
function transformWeeeProduct(rawProduct: WeeeRawProduct, index: number): WeeeProduct {
  return {
    id: `weee-${index}`, // 生成唯一 ID
    name: rawProduct.product_name,
    price: rawProduct.price,
    image: rawProduct.image_url,
    ingredientId: '', // 这个会在匹配时设置，暂时为空
  };
}

export async function GET() {
  try {
    // 读取 JSON 文件
    const filePath = join(process.cwd(), 'data', 'Products Data.json');
    const fileContents = readFileSync(filePath, 'utf-8');
    const rawProducts: WeeeRawProduct[] = JSON.parse(fileContents);

    // 转换数据格式
    const products: WeeeProduct[] = rawProducts.map((product, index) =>
      transformWeeeProduct(product, index)
    );

    return NextResponse.json({
      products,
      total: products.length,
    });
  } catch (error: any) {
    console.error('Error reading products data:', error);
    return NextResponse.json(
      { error: 'Failed to load products data', details: error.message },
      { status: 500 }
    );
  }
}



