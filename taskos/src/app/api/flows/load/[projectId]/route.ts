import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  console.log('🔥 FLOWS LOAD GET: Starting request');
  
  // Fix for Next.js dynamic route parameter handling
  const { projectId } = params;
  
  console.log('🔥 FLOWS LOAD GET: Project ID from params:', projectId);
  console.log('🔥 FLOWS LOAD GET: API_BASE_URL:', API_BASE_URL);
  
  try {
    
    if (!projectId) {
      console.error('❌ FLOWS LOAD GET: Missing project_id');
      return NextResponse.json(
        { error: 'project_id is required' },
        { status: 400 }
      );
    }

    // Forward the request to the FastAPI backend
    const backendUrl = `${API_BASE_URL}/api/flows/load/${projectId}`;
    console.log('🔥 FLOWS LOAD GET: Backend URL:', backendUrl);
    const cookies = request.headers.get('cookie') || '';
    console.log('🔥 FLOWS LOAD GET: Cookies length:', cookies.length);
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        // Forward cookies for authentication
        'Cookie': cookies,
      },
    });

    console.log('🔥 FLOWS LOAD GET: Backend response status:', response.status);
    console.log('🔥 FLOWS LOAD GET: Backend response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ FLOWS LOAD GET: Backend error response:', errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { detail: errorText || 'Unknown error' };
      }
      console.error('❌ FLOWS LOAD GET: Parsed error data:', errorData);
      return NextResponse.json(
        { error: errorData.detail || errorData.message || errorText || 'Failed to load flow', fullError: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ FLOWS LOAD GET: Success response:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ FLOWS LOAD GET: Catch block error:', error);
    console.error('❌ FLOWS LOAD GET: Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error), fullError: error },
      { status: 500 }
    );
  }
}
