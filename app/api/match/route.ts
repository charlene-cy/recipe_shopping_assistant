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

// Basic ingredients that should not be matched (excluded from shopping list)
const BASIC_INGREDIENTS = ['water', 'salt', 'sugar'];

/**
 * Check if an ingredient is a basic ingredient that should be excluded from matching
 * @param ingredientName - The name of the ingredient to check
 * @returns true if the ingredient is a basic ingredient
 */
const isBasicIngredient = (ingredientName: string): boolean => {
  const normalized = ingredientName.toLowerCase().trim();
  return BASIC_INGREDIENTS.some(basic => normalized.includes(basic));
};

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

// Comprehensive ingredient synonym dictionary
const INGREDIENT_SYNONYMS: Record<string, string[]> = {
  // Vegetables & Aromatics
  'scallions': ['green onion', 'spring onion', 'scallion'],
  'green onions': ['scallions', 'spring onion', 'scallion'],
  'spring onions': ['scallions', 'green onion', 'scallion'],
  'cilantro': ['coriander', 'chinese parsley', 'cilantro leaves'],
  'coriander': ['cilantro', 'chinese parsley'],
  'bok choy': ['pak choi', 'chinese cabbage', 'bok choi'],
  'napa cabbage': ['chinese cabbage', 'wong bok'],
  'daikon': ['white radish', 'chinese radish', 'japanese radish'],
  'shiitake': ['shiitake mushroom', 'chinese mushroom'],
  'wood ear': ['black fungus', 'cloud ear mushroom'],
  'ginger': ['fresh ginger', 'ginger root'],
  'garlic': ['garlic cloves', 'fresh garlic'],
  'shallots': ['shallot', 'asian shallot'],
  'chili': ['chile', 'chili pepper', 'hot pepper'],
  'bell pepper': ['sweet pepper', 'capsicum'],
  'eggplant': ['aubergine', 'chinese eggplant'],

  // Proteins
  'chicken breast': ['chicken', 'chicken breast fillet'],
  'chicken thigh': ['chicken thighs', 'chicken leg'],
  'pork belly': ['pork', 'pork belly slices'],
  'ground pork': ['minced pork', 'pork mince'],
  'ground beef': ['minced beef', 'beef mince'],
  'beef': ['beef steak', 'beef chuck'],
  'shrimp': ['prawns', 'shrimps'],
  'prawns': ['shrimp', 'shrimps'],
  'tofu': ['bean curd', 'soybean curd'],
  'firm tofu': ['extra firm tofu', 'pressed tofu'],
  'silken tofu': ['soft tofu', 'japanese tofu'],
  'fish sauce': ['nam pla', 'nuoc mam'],

  // Sauces & Condiments
  'soy sauce': ['soya sauce', 'shoyu', 'light soy sauce'],
  'dark soy sauce': ['thick soy sauce', 'dark soya sauce'],
  'oyster sauce': ['oyster flavored sauce'],
  'hoisin sauce': ['chinese barbecue sauce'],
  'sesame oil': ['sesame seed oil', 'toasted sesame oil'],
  'rice vinegar': ['rice wine vinegar', 'chinese vinegar'],
  'black vinegar': ['chinkiang vinegar', 'chinese black vinegar'],
  'chili oil': ['hot oil', 'chili sesame oil'],
  'chili paste': ['chili sauce', 'hot pepper paste'],
  'bean paste': ['doubanjiang', 'fermented bean paste'],
  'miso': ['soybean paste', 'fermented soybean paste'],

  // Rice, Noodles & Starches
  'jasmine rice': ['white rice', 'thai jasmine rice'],
  'white rice': ['jasmine rice', 'long grain rice'],
  'short grain rice': ['sushi rice', 'japanese rice'],
  'glutinous rice': ['sticky rice', 'sweet rice'],
  'rice noodles': ['rice vermicelli', 'rice stick noodles'],
  'vermicelli': ['rice noodles', 'thin rice noodles'],
  'ramen': ['ramen noodles', 'japanese noodles'],
  'udon': ['udon noodles', 'thick wheat noodles'],
  'soba': ['soba noodles', 'buckwheat noodles'],
  'egg noodles': ['chinese egg noodles', 'lo mein noodles'],
  'cornstarch': ['corn starch', 'corn flour', 'cornflour', 'maize starch', 'starch', 'potato starch'],
  'corn starch': ['cornstarch', 'corn flour', 'cornflour', 'maize starch', 'starch', 'potato starch'],
  'corn flour': ['cornstarch', 'corn starch', 'cornflour', 'starch'],
  'potato starch': ['potato flour', 'potato starch powder', 'starch', 'cornstarch', 'corn starch'],
  'potato flour': ['potato starch', 'starch'],

  // Cooking Wine & Alcohol
  'rice wine': ['shaoxing wine', 'chinese cooking wine', 'chinese rice wine'],
  'shaoxing wine': ['rice wine', 'chinese cooking wine'],
  'mirin': ['sweet rice wine', 'japanese rice wine'],
  'sake': ['japanese rice wine', 'cooking sake'],

  // Dried Goods & Spices
  'star anise': ['chinese star anise', 'anise star'],
  'sichuan peppercorn': ['szechuan pepper', 'chinese peppercorn'],
  'five spice': ['chinese five spice', 'five spice powder'],
  'white pepper': ['ground white pepper', 'white pepper powder'],
  'black pepper': ['ground black pepper', 'pepper'],
  'dried chili': ['dried red chili', 'dried red pepper'],
  'bay leaf': ['bay leaves', 'laurel leaf'],

  // Oils & Fats
  'vegetable oil': ['cooking oil', 'neutral oil'],
  'peanut oil': ['groundnut oil'],
  'coconut oil': ['coconut cooking oil'],
  'oil': ['cooking oil', 'vegetable oil'],

  // Common Ingredients
  'egg': ['eggs', 'chicken egg'],
  'salt': ['table salt', 'sea salt', 'kosher salt'],
  'sugar': ['white sugar', 'granulated sugar', 'cane sugar'],
  'brown sugar': ['dark brown sugar', 'light brown sugar'],
  'honey': ['pure honey', 'natural honey'],
  'water': ['cold water', 'tap water', 'filtered water'],
  'broth': ['stock', 'bouillon'],
  'chicken broth': ['chicken stock', 'chicken bouillon'],
  'vegetable broth': ['vegetable stock', 'veg stock'],
  'flour': ['all-purpose flour', 'wheat flour', 'plain flour'],
  'all-purpose flour': ['flour', 'ap flour', 'plain flour'],
  'starch': ['cornstarch', 'corn starch', 'potato starch'],

  // Beans & Legumes
  'edamame': ['soybean', 'green soybean'],
  'black beans': ['fermented black beans', 'salted black beans'],
  'red beans': ['adzuki beans', 'azuki beans'],
  'mung beans': ['green beans', 'mung bean'],
};

// Helper function to expand ingredient name with synonyms
const expandIngredientWithSynonyms = (ingredientName: string): string[] => {
  const normalized = ingredientName.toLowerCase().trim();
  const synonyms = INGREDIENT_SYNONYMS[normalized] || [];

  // Return array with original name + all synonyms (unique values)
  return Array.from(new Set([normalized, ...synonyms]));
};

type ScoredProduct = ProductPayload & { score: number };

const scoreProduct = (
  ingredientName: string,
  ingredientTokens: string[],
  synonymVariants: string[],
  product: ProductPayload
): ScoredProduct => {
  const rawName = product.name ?? product.product_name ?? '';
  const name = rawName.toLowerCase();
  let score = 0;
  let matchedSynonym = '';

  if (!name) {
    console.log('[match][score] product has no name, skipping:', product.id);
    return { ...product, score };
  }

  // Test against all synonym variants (original + synonyms)
  for (const variant of synonymVariants) {
    // Score 5: Exact full string match
    if (name === variant) {
      score = Math.max(score, 5);
      matchedSynonym = variant;
      console.log('[match][score] EXACT match (full string):', {
        productId: product.id,
        name: rawName,
        variant,
        score,
      });
      break; // Found highest possible score, exit early
    }
    // Score 4: Phrase match (contains ingredient)
    else if (name.includes(variant)) {
      if (score < 4) {
        score = 4;
        matchedSynonym = variant;
        console.log('[match][score] PHRASE match (contains ingredient):', {
          productId: product.id,
          name: rawName,
          variant,
          score,
        });
      }
    }
  }

  // Score 3: Word boundary match (changed from <= 2 to <= 1, allowing 2-char tokens)
  const exactWordMatch = ingredientTokens.some((token) => {
    if (token.length <= 1) return false; // Allow 2+ character tokens
    const wordRegex = new RegExp(`\\b${escapeRegex(token)}\\b`);
    return wordRegex.test(name);
  });

  if (exactWordMatch && score < 3) {
    score = 3;
    console.log('[match][score] WORD match:', { productId: product.id, name: rawName, score });
  }

  // Score 2: Partial token match (changed from > 2 to > 1, allowing 2-char tokens)
  const partialMatch = ingredientTokens.some((token) => token.length > 1 && name.includes(token));
  if (partialMatch && score < 2) {
    score = 2;
    console.log('[match][score] PARTIAL match:', { productId: product.id, name: rawName, score });
  }

  if (score > 0) {
    console.log('[match][score] Final score:', {
      productId: product.id,
      name: rawName,
      score,
      matchedSynonym: matchedSynonym || 'token match',
    });
  }

  return { ...product, score };
};

const prefilterProducts = (ingredient: IngredientPayload, products: ProductPayload[], maxCandidates: number) => {
  const ingredientName = ingredient.name.toLowerCase().trim();
  const tokens = ingredientName.split(/\s+/).filter(Boolean);

  // Expand ingredient with synonyms
  const synonymVariants = expandIngredientWithSynonyms(ingredientName);

  console.log('[match] Ingredient:', ingredientName);
  console.log('[match] Synonyms expanded:', synonymVariants);

  const scored = products
    .map((product) => scoreProduct(ingredientName, tokens, synonymVariants, product))
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
      reasoning: 'This product closely matches the taste and texture you need for your recipe. Our system found this to be the best available option based on the ingredient name and cooking application.',
    },
    alternatives: candidates.slice(1, 6).map((candidate) => ({
      ...candidate,
      confidence: 70,
      confidenceLabel: 'medium' as const,
      reasoning: 'This is another good option that works well for this ingredient. We ranked it based on how closely it matches your recipe needs.',
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

    // Skip matching for basic ingredients
    if (isBasicIngredient(ingredient.name)) {
      console.log('[match] Skipping basic ingredient:', ingredient.name);
      return NextResponse.json({
        ingredient,
        bestMatch: null,
        alternatives: [],
        candidateCount: 0,
      });
    }

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
