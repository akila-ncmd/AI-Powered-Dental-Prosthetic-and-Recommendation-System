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

    // Forward the request to the PDF API
    const pdfApiUrl = process.env.PDF_API_URL || 'http://127.0.0.1:5000';
    const pdfResponse = await fetch(`${pdfApiUrl}/generate-report/${patientId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!pdfResponse.ok) {
      const errorText = await pdfResponse.text();
      console.error('PDF API error:', errorText);
      return NextResponse.json(
        { error: `PDF API error: ${pdfResponse.status} ${pdfResponse.statusText}` },
        { status: pdfResponse.status }
      );
    }

    // Return the PDF blob
    const pdfBlob = await pdfResponse.blob();
    return new NextResponse(pdfBlob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': pdfResponse.headers.get('Content-Disposition') || 'attachment; filename=report.pdf',
      },
    });

  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}