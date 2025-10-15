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
      'images.unsplash.com',
      'via.placeholder.com',
      'picsum.photos',
    ];

    if (!allowedDomains.some(domain => parsedUrl.hostname.includes(domain))) {
      return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 });
    }

    // Fetch the image
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; DDPC-Image-Proxy/1.0)',
          'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return NextResponse.json(
          { error: `Failed to fetch image: ${response.status}` },
          { status: response.status }
        );
      }

      // Get the image buffer
      const imageBuffer = await response.arrayBuffer();

      // Return the image with appropriate headers
      const contentType = response.headers.get('content-type') || 'image/jpeg';

      return new NextResponse(new Uint8Array(imageBuffer), {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        },
      });

    } catch (fetchError) {
      console.log('Fetch error:', fetchError);
      clearTimeout(timeoutId);
      return NextResponse.json(
        { error: 'Failed to fetch image' },
        { status: 502 }
      );
    }

  } catch (error) {
    console.error('Image proxy error:', error);
    return NextResponse.json(
      { error: 'Invalid URL or other error' },
      { status: 400 }
    );
  }
}