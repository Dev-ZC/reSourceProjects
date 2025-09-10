import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  console.log('🔥 FLOWS POST: Starting request');
  try {
    const body = await request.json();
    console.log('🔥 FLOWS POST: Request body:', JSON.stringify(body, null, 2));
    console.log('🔥 FLOWS POST: API_BASE_URL:', API_BASE_URL);
    
    // Forward the request to the FastAPI backend
    const response = await fetch(`${API_BASE_URL}/api/flows/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward cookies for authentication
        'Cookie': request.headers.get('cookie') || '',
      },
      body: JSON.stringify(body),
    });

    console.log('🔥 FLOWS POST: Backend response status:', response.status);
    console.log('🔥 FLOWS POST: Backend response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ FLOWS POST: Backend error response:', errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { detail: errorText || 'Unknown error' };
      }
      console.error('❌ FLOWS POST: Parsed error data:', errorData);
      return NextResponse.json(
        { error: errorData.detail || errorData.message || errorText || 'Failed to save flow', fullError: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ FLOWS POST: Success response:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ FLOWS POST: Catch block error:', error);
    console.error('❌ FLOWS POST: Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error), fullError: error },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  console.log('🔥 FLOWS GET: Starting request');
  console.log('🔥 FLOWS GET: Request URL:', request.url);
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    console.log('🔥 FLOWS GET: Project ID:', projectId);
    console.log('🔥 FLOWS GET: API_BASE_URL:', API_BASE_URL);

    if (!projectId) {
      console.error('❌ FLOWS GET: Missing project_id');
      return NextResponse.json(
        { error: 'project_id is required' },
        { status: 400 }
      );
    }

    // Forward the request to the FastAPI backend
    const backendUrl = `${API_BASE_URL}/api/flows/load/${projectId}`;
    console.log('🔥 FLOWS GET: Backend URL:', backendUrl);
    console.log('🔥 FLOWS GET: Request URL pattern: /api/flows?project_id=${projectId}');
    const cookies = request.headers.get('cookie') || '';
    console.log('🔥 FLOWS GET: Cookies length:', cookies.length);
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        // Forward cookies for authentication
        'Cookie': cookies,
      },
    });

    console.log('🔥 FLOWS GET: Backend response status:', response.status);
    console.log('🔥 FLOWS GET: Backend response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ FLOWS GET: Backend error response:', errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { detail: errorText || 'Unknown error' };
      }
      console.error('❌ FLOWS GET: Parsed error data:', errorData);
      return NextResponse.json(
        { error: errorData.detail || errorData.message || errorText || 'Failed to load flow', fullError: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ FLOWS GET: Success response:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ FLOWS GET: Catch block error:', error);
    console.error('❌ FLOWS GET: Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error), fullError: error },
      { status: 500 }
    );
  }
}
