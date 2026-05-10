import { NextResponse } from 'next/server';
import { loadDocs } from '@/lib/mcp/store';

export async function GET() {
  try {
    const docs = await loadDocs();
    return NextResponse.json(docs);
  } catch (err) {
    return NextResponse.json(
      {
        statusCode: 500,
        message: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
