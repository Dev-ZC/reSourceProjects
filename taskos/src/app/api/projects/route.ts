import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  console.log('🔥 PROJECTS POST: Starting request');
  try {
    const body = await request.json();
    console.log('🔥 PROJECTS POST: Request body:', JSON.stringify(body, null, 2));
    console.log('🔥 PROJECTS POST: API_BASE_URL:', API_BASE_URL);
    
    // Forward the request to the FastAPI backend
    const response = await fetch(`${API_BASE_URL}/api/projects/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward cookies for authentication
        'Cookie': request.headers.get('cookie') || '',
      },
      body: JSON.stringify(body),
    });

    console.log('🔥 PROJECTS POST: Backend response status:', response.status);
    console.log('🔥 PROJECTS POST: Backend response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ PROJECTS POST: Backend error response:', errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { detail: errorText || 'Unknown error' };
      }
      console.error('❌ PROJECTS POST: Parsed error data:', errorData);
      return NextResponse.json(
        { error: errorData.detail || errorData.message || errorText || 'Failed to create project', fullError: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ PROJECTS POST: Success response:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ PROJECTS POST: Catch block error:', error);
    console.error('❌ PROJECTS POST: Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error), fullError: error },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { project_id, ...updateData } = body;
    
    if (!project_id) {
      return NextResponse.json(
        { error: 'project_id is required' },
        { status: 400 }
      );
    }
    
    // Forward the request to the FastAPI backend
    const response = await fetch(`${API_BASE_URL}/api/projects/update/${project_id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        // Forward cookies for authentication
        'Cookie': request.headers.get('cookie') || '',
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      return NextResponse.json(
        { error: errorData.detail || 'Failed to update project' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Project update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');

    if (!projectId) {
      return NextResponse.json(
        { error: 'project_id is required' },
        { status: 400 }
      );
    }

    // Forward the request to the FastAPI backend
    const response = await fetch(`${API_BASE_URL}/api/projects/delete/${projectId}`, {
      method: 'DELETE',
      headers: {
        // Forward cookies for authentication
        'Cookie': request.headers.get('cookie') || '',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      return NextResponse.json(
        { error: errorData.detail || 'Failed to delete project' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Project delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  console.log('🔥 PROJECTS GET: Starting request');
  console.log('🔥 PROJECTS GET: Request URL:', request.url);
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    console.log('🔥 PROJECTS GET: Project ID:', projectId);
    console.log('🔥 PROJECTS GET: API_BASE_URL:', API_BASE_URL);

    // If project_id is provided, get specific project, otherwise get all user projects
    const endpoint = projectId 
      ? `${API_BASE_URL}/api/projects/get/${projectId}`
      : `${API_BASE_URL}/api/projects/list`;
    console.log('🔥 PROJECTS GET: Backend endpoint:', endpoint);

    const cookies = request.headers.get('cookie') || '';
    console.log('🔥 PROJECTS GET: Cookies length:', cookies.length);
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        // Forward cookies for authentication
        'Cookie': cookies,
      },
    });

    console.log('🔥 PROJECTS GET: Backend response status:', response.status);
    console.log('🔥 PROJECTS GET: Backend response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ PROJECTS GET: Backend error response:', errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { detail: errorText || 'Unknown error' };
      }
      console.error('❌ PROJECTS GET: Parsed error data:', errorData);
      return NextResponse.json(
        { error: errorData.detail || errorData.message || errorText || 'Failed to fetch project(s)', fullError: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ PROJECTS GET: Success response:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ PROJECTS GET: Catch block error:', error);
    console.error('❌ PROJECTS GET: Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error), fullError: error },
      { status: 500 }
    );
  }
}
