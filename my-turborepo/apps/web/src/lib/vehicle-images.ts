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

  const isAcceptableUrl = (url: string) => {
    if (!url) return false;
    if (url.startsWith('/api/')) return true;
    return url.startsWith('http://') || url.startsWith('https://');
  };
  return cleaned
    .split(';')
    .map(url => url.trim())
    .filter(url => isAcceptableUrl(url));
}

/**
 * Get a prioritized list of image sources for a vehicle
 * Tries multiple domains and formats for better reliability
 */
export function getVehicleImageSources(
  imageUrlString?: string | null,
  _make?: string,
  _model?: string,
  _year?: string
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

  // For Next.js Image component, we need to return the original URLs
  // The proxy will be handled by the ImageWithFallback component
  return sortedUrls;
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
