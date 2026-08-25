import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    // Next.js 15 makes route params a Promise; destructuring it synchronously
    // yields undefined and sends "/patients/undefined" to the backend.
    const { patientId } = await params;
    const body = await request.json();

    // Forward the request to the backend
    const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:8000';
    const backendResponse = await fetch(`${backendUrl}/patients/${patientId}/analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error('Backend error:', errorText);
      return NextResponse.json(
        { error: `Backend error: ${backendResponse.status} ${backendResponse.statusText}` },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
