import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export async function PUT(
  request: NextRequest,
  { params }: { params: { doc_id: string } }
) {
  try {
    const { doc_id } = params;
    const body = await request.json();

    if (!doc_id) {
      return NextResponse.json(
        { error: 'doc_id is required' },
        { status: 400 }
      );
    }

    // Forward the request to the FastAPI backend
    const response = await fetch(`${API_BASE_URL}/api/docs/update/${doc_id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        // Forward cookies for authentication
        'Cookie': request.headers.get('cookie') || '',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      return NextResponse.json(
        { error: errorData.detail || 'Failed to update document' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Document update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
