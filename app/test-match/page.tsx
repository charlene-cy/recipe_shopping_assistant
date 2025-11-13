'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/src/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/src/components/ui/alert';
import { Badge } from '@/src/components/ui/badge';

interface ProductMatchDisplay {
  id: string;
  name: string;
  price?: number;
  category?: string;
  confidence: number;
  confidenceLabel: 'high' | 'medium' | 'low';
  reasoning: string;
}

interface MatchResponse {
  ingredient: {
    id?: string;
    name: string;
    amount?: string;
    details?: string;
    recipeName?: string;
  };
  bestMatch: ProductMatchDisplay | null;
  alternatives: ProductMatchDisplay[];
  candidateCount: number;
  modelResponse?: unknown;
}

interface ErrorResponse {
  error: string;
  details?: string;
}

const QUICK_INGREDIENTS = ['Beef', 'Garlic', 'Soy Sauce', 'Green Onion', 'Rice'];

const confidenceText = (confidence: number, label: 'high' | 'medium' | 'low') => {
  const description = {
    high: 'High confidence',
    medium: 'Medium confidence',
    low: 'Low confidence',
  }[label];
  return `${confidence}% • ${description}`;
};

export default function TestMatchPage() {
  const [ingredientName, setIngredientName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<MatchResponse | null>(null);
  const [rawResponse, setRawResponse] = useState<string | null>(null);

  const candidateCount = response?.candidateCount ?? null;

  const handleTestMatch = async (name?: string) => {
    const ingredient = (name ?? ingredientName).trim();
    if (!ingredient) {
      setError('Please enter an ingredient name.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResponse(null);
    setRawResponse(null);

    try {
      const productsRes = await fetch('/api/products');
      if (!productsRes.ok) {
        throw new Error('Failed to load product catalog.');
      }

      const productsData = await productsRes.json();
      const products = productsData.products ?? [];

      const matchRes = await fetch('/api/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ingredient: {
            name: ingredient,
            recipeName: 'Test Recipe',
          },
          products,
        }),
      });

      const matchJson = await matchRes.json();
      setRawResponse(JSON.stringify(matchJson, null, 2));

      if (!matchRes.ok) {
        const err = matchJson as ErrorResponse;
        setError(err.error ?? 'Unknown error');
        return;
      }

      setResponse(matchJson as MatchResponse);
    } catch (err: any) {
      console.error('Match test failed:', err);
      setError(err.message ?? 'Failed to test match.');
    } finally {
      setIsLoading(false);
    }
  };

  const alternativesLabel = useMemo(() => {
    if (!response) return '';
    const count = response.alternatives.length;
    if (count === 0) return 'No additional alternatives';
    return `Show ${count} more option${count > 1 ? 's' : ''}`;
  }, [response]);

  const renderProductCard = (title: string, product: ProductMatchDisplay | null) => {
    if (!product) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">No match available.</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-lg font-semibold">{product.name}</p>
            <p className="text-sm text-gray-600">
              {product.category ? `${product.category} • ` : ''}
              {typeof product.price === 'number' ? `$${product.price.toFixed(2)}` : 'Price unavailable'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant={
                product.confidenceLabel === 'high'
                  ? 'default'
                  : product.confidenceLabel === 'medium'
                  ? 'secondary'
                  : 'outline'
              }
            >
              {confidenceText(product.confidence, product.confidenceLabel)}
            </Badge>
          </div>

          <p className="text-sm text-gray-600">{product.reasoning}</p>
        </CardContent>
      </Card>
    );
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Test Ingredient Matching</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3">
              <Input
                placeholder="Enter ingredient name..."
                value={ingredientName}
                onChange={(event) => setIngredientName(event.target.value)}
              />
              <Button disabled={isLoading} onClick={() => handleTestMatch()}>
                {isLoading ? 'Matching...' : 'Test Match'}
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {QUICK_INGREDIENTS.map((quickIngredient) => (
                <Button
                  key={quickIngredient}
                  variant="outline"
                  onClick={() => {
                    setIngredientName(quickIngredient);
                    handleTestMatch(quickIngredient);
                  }}
                >
                  {quickIngredient}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {isLoading && (
          <Alert>
            <AlertTitle>Matching ingredient...</AlertTitle>
            <AlertDescription>Running pre-filter and GPT matching.</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Match failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {response && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                Ingredient: <strong>{response.ingredient.name}</strong>
              </span>
              <span>
                Candidates considered: {candidateCount !== null ? candidateCount : 'Unknown'}
              </span>
            </div>

            {renderProductCard('Best Match', response.bestMatch)}

            <Accordion type="single" collapsible className="border rounded-lg">
              <AccordionItem value="alternatives">
                <AccordionTrigger className="px-4">
                  {alternativesLabel}
                </AccordionTrigger>
                <AccordionContent className="space-y-3 px-4 pb-4 pt-2">
                  {response.alternatives.length === 0 ? (
                    <p className="text-sm text-gray-500">No additional alternatives.</p>
                  ) : (
                    response.alternatives.map((product) => (
                      <Card key={product.id} className="border-gray-200">
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{product.name}</p>
                            <Badge
                              variant={
                                product.confidenceLabel === 'high'
                                  ? 'default'
                                  : product.confidenceLabel === 'medium'
                                  ? 'secondary'
                                  : 'outline'
                              }
                            >
                              {confidenceText(product.confidence, product.confidenceLabel)}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {product.category ? `${product.category} • ` : ''}
                            {typeof product.price === 'number' ? `$${product.price.toFixed(2)}` : 'Price unavailable'}
                          </p>
                          <p className="text-sm text-gray-600">{product.reasoning}</p>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}

        {rawResponse && (
          <Accordion type="single" collapsible className="border rounded-lg">
            <AccordionItem value="raw-response">
              <AccordionTrigger className="px-4">Raw API Response</AccordionTrigger>
              <AccordionContent>
                <pre className="overflow-x-auto whitespace-pre-wrap bg-gray-900 text-gray-100 text-sm p-4 rounded-b-lg">
                  {rawResponse}
                </pre>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </div>
    </main>
  );
}
