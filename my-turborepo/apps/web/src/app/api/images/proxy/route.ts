import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  // Validate URL to prevent abuse
  try {
    const parsedUrl = new URL(url);

    // Only allow certain domains for security
    const allowedDomains = [
      'www.edmunds.com',
      'media.ed.edmunds-media.com',
      'assets.edmundsapps.com',
      'source.unsplash.com',
      'commons.wikimedia.org',
    ];

    if (!allowedDomains.some(domain => parsedUrl.hostname.includes(domain))) {
      return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 });
    }

    // Fetch the image
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'DDPC-Image-Proxy/1.0',
        'Accept': 'image/*',
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.status}` },
        { status: response.status }
      );
    }

    // Get the image buffer
    const imageBuffer = await response.arrayBuffer();

    // Return the image with appropriate headers
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': response.headers.get('content-type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    });

  } catch (error) {
    console.error('Image proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy image' },
      { status: 500 }
    );
  }
}
