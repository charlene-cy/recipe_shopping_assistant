import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        hasKey: false,
        message: 'OPENAI_API_KEY is not configured.',
      },
      { status: 503 }
    );
  }

  return NextResponse.json({
    hasKey: true,
    keyPrefix: apiKey.slice(0, 10),
  });
}
