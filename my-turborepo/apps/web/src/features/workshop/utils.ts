export const getTrackingLink = (number: string, carrier?: string | null) => {
  // If we know the carrier, we can be specific (optional polish)
  if (carrier?.toLowerCase() === 'usps') return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${number}`;
  if (carrier?.toLowerCase() === 'ups') return `https://www.ups.com/track?tracknum=${number}`;
  if (carrier?.toLowerCase() === 'fedex') return `https://www.fedex.com/fedextrack/?trknbr=${number}`;
  if (carrier?.toLowerCase() === 'dhl') return `https://www.dhl.com/global-en/home/tracking.html?tracking-id=${number}`;
  
  // The universal fallback (Safest bet)
  return `https://www.google.com/search?q=${number}`;
};
