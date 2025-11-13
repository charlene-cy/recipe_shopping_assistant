import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

interface IngredientPayload {
  id?: string;
  name: string;
  amount?: string;
  details?: string;
  recipeName?: string;
}

interface ProductPayload {
  id: string;
  name: string;
  product_name?: string;
  price?: number;
  image?: string;
  category?: string;
  ingredientId?: string;
}

interface MatchRequestBody {
  ingredient?: IngredientPayload;
  products?: ProductPayload[];
  options?: {
    maxCandidates?: number;
    temperature?: number;
  };
}

interface RankedMatchResult {
  productId: string;
  confidence: number; // 0-100
  reasoning: string;
}

interface MatchResponseBody {
  ingredient: IngredientPayload;
  bestMatch: (ProductPayload & {
    confidence: number;
    confidenceLabel: 'high' | 'medium' | 'low';
    reasoning: string;
  }) | null;
  alternatives: Array<
    ProductPayload & {
      confidence: number;
      confidenceLabel: 'high' | 'medium' | 'low';
      reasoning: string;
    }
  >;
  candidateCount: number;
  modelResponse?: unknown;
}

const MAX_PRODUCTS_FOR_MODEL = 20;
const MIN_ALTERNATIVE_CONFIDENCE = 60;
const HIGH_CONFIDENCE_THRESHOLD = 80;
const DEFAULT_CONFIDENCE = 65;

const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new OpenAI({ apiKey });
};

const validateRequest = (body: MatchRequestBody) => {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body must be an object');
  }

  const { ingredient, products } = body;

  if (!ingredient || typeof ingredient.name !== 'string' || ingredient.name.trim().length === 0) {
    throw new Error('Ingredient name is required');
  }

  if (!Array.isArray(products) || products.length === 0) {
    throw new Error('Products array is required and must not be empty');
  }

  for (const product of products) {
    if (!product || typeof product.id !== 'string' || typeof (product.name ?? product.product_name) !== 'string') {
      throw new Error('Each product must include "id" and "name" fields');
    }
  }
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

type ScoredProduct = ProductPayload & { score: number };

const scoreProduct = (ingredientName: string, ingredientTokens: string[], product: ProductPayload): ScoredProduct => {
  const rawName = product.name ?? product.product_name ?? '';
  const name = rawName.toLowerCase();
  let score = 0;

  if (!name) {
    console.log('[match][score] product has no name, skipping:', product.id);
    return { ...product, score };
  }

  if (name === ingredientName) {
    score = 5;
    console.log('[match][score] EXACT match (full string):', { productId: product.id, name: rawName, score });
  } else if (name.includes(ingredientName)) {
    score = Math.max(score, 4);
    console.log('[match][score] PHRASE match (contains ingredient):', { productId: product.id, name: rawName, score });
  }

  const exactWordMatch = ingredientTokens.some((token) => {
    if (token.length <= 2) return false;
    const wordRegex = new RegExp(`\\b${escapeRegex(token)}\\b`);
    return wordRegex.test(name);
  });

  if (exactWordMatch) {
    score = Math.max(score, 3);
    console.log('[match][score] WORD match:', { productId: product.id, name: rawName, score });
  }

  const partialMatch = ingredientTokens.some((token) => token.length > 2 && name.includes(token));
  if (partialMatch) {
    score = Math.max(score, 2);
    console.log('[match][score] PARTIAL match:', { productId: product.id, name: rawName, score });
  }

  if (score > 0) {
    console.log('[match][score] Final score:', { productId: product.id, name: rawName, score });
  }

  return { ...product, score };
};

const prefilterProducts = (ingredient: IngredientPayload, products: ProductPayload[], maxCandidates: number) => {
  const ingredientName = ingredient.name.toLowerCase().trim();
  const tokens = ingredientName.split(/\s+/).filter(Boolean);

  const scored = products
    .map((product) => scoreProduct(ingredientName, tokens, product))
    .filter((product) => product.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score || (a.name ?? a.product_name ?? '').localeCompare(b.name ?? b.product_name ?? '')
    );

  const limited = scored.slice(0, maxCandidates);

  console.log('[match] Total products checked:', products.length);
  console.log('[match] Products passed filter:', scored.length);
  console.log(
    '[match] Candidates sent to OpenAI:',
    limited.map((p) => ({ id: p.id, name: p.name ?? p.product_name, score: p.score }))
  );

  return limited;
};

const buildProductListForPrompt = (products: ScoredProduct[]) => {
  return products.map((p, index) => ({
    rank: index + 1,
    id: p.id,
    name: p.name ?? p.product_name,
    category: p.category,
    price: typeof p.price === 'number' ? p.price : undefined,
    score: p.score,
  }));
};

const classifyConfidence = (confidence: number): 'high' | 'medium' | 'low' => {
  if (confidence >= HIGH_CONFIDENCE_THRESHOLD) {
    return 'high';
  }
  if (confidence >= MIN_ALTERNATIVE_CONFIDENCE) {
    return 'medium';
  }
  return 'low';
};

const normalizeConfidence = (value: unknown) => {
  const num = Number(value);
  if (Number.isFinite(num)) {
    return Math.min(100, Math.max(0, Math.round(num)));
  }
  return DEFAULT_CONFIDENCE;
};

const fallbackFromCandidates = (candidates: ScoredProduct[]) => {
  if (candidates.length === 0) {
    return null;
  }

  const top = candidates[0];
  return {
    bestMatch: {
      ...top,
      confidence: 80,
      confidenceLabel: 'high' as const,
      reasoning: 'Selected top pre-filter candidate because AI did not return a confident match.',
    },
    alternatives: candidates.slice(1, 6).map((candidate) => ({
      ...candidate,
      confidence: 70,
      confidenceLabel: 'medium' as const,
      reasoning: 'Ranked by server-side relevance scoring.',
    })),
  };
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as MatchRequestBody;
    validateRequest(body);

    const ingredient = body.ingredient as IngredientPayload;
    const products = body.products as ProductPayload[];
    const { options } = body;

    const maxCandidates = Math.min(
      Math.max(options?.maxCandidates ?? MAX_PRODUCTS_FOR_MODEL, 1),
      MAX_PRODUCTS_FOR_MODEL
    );

    const candidates = prefilterProducts(ingredient, products, maxCandidates);

    if (candidates.length === 0) {
      return NextResponse.json(
        {
          error: 'No matching products found during pre-filtering. Please refine the ingredient name or update product data.',
        },
        { status: 404 }
      );
    }

    const openai = getOpenAIClient();
    if (!openai) {
      return NextResponse.json(
        {
          error: 'OpenAI API key is not configured',
        },
        { status: 503 }
      );
    }

    const promptProducts = buildProductListForPrompt(candidates);

    const promptContext: string[] = [`Ingredient name: ${ingredient.name}`];

    if (ingredient.amount) {
      promptContext.push(`Amount: ${ingredient.amount}`);
    }
    if (ingredient.recipeName) {
      promptContext.push(`Recipe: ${ingredient.recipeName}`);
    }
    if (ingredient.details) {
      promptContext.push(`Notes: ${ingredient.details}`);
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: options?.temperature ?? 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a precise assistant that matches recipe ingredients with grocery catalog products.
Return a JSON object with this shape:
{
  "bestMatch": {
    "productId": string,
    "confidence": number (0-100),
    "reasoning": string
  },
  "alternatives": [
    {
      "productId": string,
      "confidence": number (0-100),
      "reasoning": string
    }
    // up to 5 items, sorted best first
  ]
}
Guidelines:
- Quality over quantity: include only products that are truly relevant.
- Confidence reflects likelihood of being an exact or acceptable substitution.
- Prefer fresh/raw whole items over processed or powders unless necessary.
- Avoid including products that are clearly different (e.g., garlic powder when fresh garlic exists).
- Only include alternatives with confidence >= 60.
- Provide clear reasoning for each selection.`,
        },
        {
          role: 'user',
          content: `Ingredient:
${promptContext.join('\n')}

Ranked Candidates (highest score first):
${JSON.stringify(promptProducts, null, 2)}

Select the single best match and up to five high-quality alternatives.`,
        },
      ],
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response from OpenAI');
    }

    const matchResult = JSON.parse(responseContent) as {
      bestMatch?: RankedMatchResult;
      alternatives?: RankedMatchResult[];
    };

    const candidateMap = new Map(candidates.map((candidate) => [candidate.id, candidate]));

    const convertToProduct = (entry?: RankedMatchResult) => {
      if (!entry) return null;
      const candidate = candidateMap.get(entry.productId);
      if (!candidate) return null;

      const confidence = normalizeConfidence(entry.confidence);
      const confidenceLabel = classifyConfidence(confidence);

      return {
        ...candidate,
        confidence,
        confidenceLabel,
        reasoning: entry.reasoning ?? 'No reasoning provided.',
      };
    };

    let bestMatch = convertToProduct(matchResult.bestMatch);

    if (!bestMatch || bestMatch.confidenceLabel !== 'high') {
      console.log('[match] AI best match missing or not high confidence. Falling back to top candidate.');
      const fallback = fallbackFromCandidates(candidates);
      if (fallback) {
        bestMatch = fallback.bestMatch;
        const alternativeProducts = fallback.alternatives.filter(
          (item) => item.id !== bestMatch?.id
        );
        const response: MatchResponseBody = {
          ingredient,
          bestMatch,
          alternatives: alternativeProducts,
          candidateCount: candidates.length,
          modelResponse: matchResult,
        };
        return NextResponse.json(response);
      }
    }

    const alternativesRaw = Array.isArray(matchResult.alternatives)
      ? matchResult.alternatives
      : [];

    const alternatives = alternativesRaw
      .map(convertToProduct)
      .filter((product): product is NonNullable<typeof product> => Boolean(product))
      .filter((product) => product.id !== bestMatch?.id)
      .filter((product) => product.confidence >= MIN_ALTERNATIVE_CONFIDENCE)
      .slice(0, 5);

    const response: MatchResponseBody = {
      ingredient,
      bestMatch,
      alternatives,
      candidateCount: candidates.length,
      modelResponse: matchResult,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error matching ingredient:', error);

    const status = error?.message?.includes('API key') ? 401 : 500;

    return NextResponse.json(
      {
        error: 'Failed to match ingredient',
        details: error.message ?? 'Unknown error',
      },
      { status }
    );
  }
}
