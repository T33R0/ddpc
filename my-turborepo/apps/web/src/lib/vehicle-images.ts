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

  // Add fallback image sources if we have make/model/year info
  const fallbacks: string[] = [];

  if (make && model && year) {
    // Try alternative stock image services
    const searchTerm = `${year} ${make} ${model}`.toLowerCase().replace(/\s+/g, '-');

    // Unsplash has some car photos but limited selection
    fallbacks.push(`https://source.unsplash.com/featured/?${make}-${model},car&w=400&h=225`);

    // Wikimedia Commons (limited car photos) - proxy it
    const wikiUrl = `https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/${make}_${model}_${year}.jpg&w=400&h=225`;
    fallbacks.push(`/api/images/proxy?url=${encodeURIComponent(wikiUrl)}`);
  }

  return [...proxiedUrls, ...fallbacks];
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
