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
    ];

    if (!allowedDomains.some(domain => parsedUrl.hostname.includes(domain))) {
      return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 });
    }

    // Fetch the image with better error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; DDPC-Image-Proxy/1.0)',
          'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
        signal: controller.signal,
        // Don't follow redirects automatically, handle them
        redirect: 'manual',
      });

      clearTimeout(timeoutId);

      // Handle redirects manually
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (location) {
          // Recursively fetch the redirect location if it's still allowed
          const redirectUrl = new URL(location, url).href;
          const redirectParsed = new URL(redirectUrl);
          if (allowedDomains.some(domain => redirectParsed.hostname.includes(domain))) {
            const redirectController = new AbortController();
            const redirectTimeoutId = setTimeout(() => redirectController.abort(), 30000);
            try {
              const redirectResponse = await fetch(redirectUrl, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (compatible; DDPC-Image-Proxy/1.0)',
                  'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
                  'Accept-Language': 'en-US,en;q=0.9',
                  'Cache-Control': 'no-cache',
                  'Pragma': 'no-cache',
                },
                signal: redirectController.signal,
              });
              clearTimeout(redirectTimeoutId);

              if (!redirectResponse.ok) {
                return NextResponse.json(
                  { error: `Failed to fetch redirected image: ${redirectResponse.status}` },
                  { status: redirectResponse.status }
                );
              }

              const redirectImageBuffer = await redirectResponse.arrayBuffer();
              return new NextResponse(redirectImageBuffer, {
                headers: {
                  'Content-Type': redirectResponse.headers.get('content-type') || 'image/jpeg',
                  'Cache-Control': 'public, max-age=86400',
                },
              });
            } catch (redirectError) {
              clearTimeout(redirectTimeoutId);
              throw redirectError;
            }
          }
        }
      }

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

    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }

  } catch (error) {
    console.error('Image proxy error:', error);
    // Return a fallback response instead of 500 for better UX
    return NextResponse.json(
      { error: 'Failed to proxy image' },
      { status: 502 } // Bad Gateway
    );
  }
}
