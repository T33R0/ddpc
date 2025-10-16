/**
 * Utility functions for handling vehicle stock images
 */

/**
 * Parse and clean image URLs from the database
 * Handles the @ separator and semicolon-separated URLs
 */
export function parseImageUrls(imageUrlString?: string | null): string[] {
  if (!imageUrlString) return [];

  // Remove the @ prefix if present and split by semicolon
  const cleaned = imageUrlString.startsWith('@')
    ? imageUrlString.slice(1)
    : imageUrlString;

  return cleaned
    .split(';')
    .map(url => url.trim())
    .filter(url => url.length > 0 && url.startsWith('http'));
}

/**
 * Get a prioritized list of image sources for a vehicle
 * Tries multiple domains and formats for better reliability
 */
export function getVehicleImageSources(
  imageUrlString?: string | null,
  make?: string,
  model?: string,
  year?: string
): string[] {
  // If the input is already a proxied URL, return it directly
  if (imageUrlString && imageUrlString.startsWith('/api/images/proxy?url=')) {
    return [imageUrlString];
  }

  const parsedUrls = parseImageUrls(imageUrlString);

  // If we have parsed URLs, prioritize media.ed.edmunds-media.com over www.edmunds.com
  // as it seems more reliable based on the data
  const sortedUrls = parsedUrls.sort((a, b) => {
    const aIsMedia = a.includes('media.ed.edmunds-media.com');
    const bIsMedia = b.includes('media.ed.edmunds-media.com');
    if (aIsMedia && !bIsMedia) return -1;
    if (!aIsMedia && bIsMedia) return 1;
    return 0;
  });

  // Create proxy URLs for external images to bypass Next.js optimization issues
  const proxiedUrls = sortedUrls.map(url => {
    if (url.includes('edmunds.com') || url.includes('edmunds-media.com')) {
      return `/api/images/proxy?url=${encodeURIComponent(url)}`;
    }
    return url;
  });

  // If we have proxied URLs, return them
  if (proxiedUrls.length > 0) {
    return proxiedUrls;
  }

  // Fallback: Generate placeholder images based on vehicle info
  const fallbacks: string[] = [];

  if (make && model && year) {
    // Create a consistent search term for image generation
    const searchTerm = `${year} ${make} ${model}`.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();

    // Primary fallback: Use picsum.photos with a consistent seed (more reliable than placeholder services)
    const seed = searchTerm.replace(/\s+/g, '-');
    fallbacks.push(`https://picsum.photos/seed/${seed}/400/225`);

    // Secondary fallback: Use a simple colored background with text (if picsum fails)
    const encodedSearch = encodeURIComponent(searchTerm);
    fallbacks.push(`https://via.placeholder.com/400x225/2563eb/ffffff?text=${encodedSearch}`);
  }

  // Final fallback: Use local DDPC logo
  fallbacks.push('/branding/fallback-logo.png');

  return fallbacks;
}

/**
 * Get the best single image URL for a vehicle
 */
export function getBestVehicleImage(
  imageUrlString?: string | null,
  make?: string,
  model?: string,
  year?: string
): string | undefined {
  const sources = getVehicleImageSources(imageUrlString, make, model, year);
  return sources[0];
}
