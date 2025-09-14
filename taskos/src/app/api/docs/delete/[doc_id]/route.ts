import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { doc_id: string } }
) {
  try {
    const { doc_id } = params;

    if (!doc_id) {
      return NextResponse.json(
        { error: 'doc_id is required' },
        { status: 400 }
      );
    }

    // Forward the request to the FastAPI backend
    const response = await fetch(`${API_BASE_URL}/api/docs/delete/${doc_id}`, {
      method: 'DELETE',
      headers: {
        // Forward cookies for authentication
        'Cookie': request.headers.get('cookie') || '',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      return NextResponse.json(
        { error: errorData.detail || 'Failed to delete document' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Document delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
