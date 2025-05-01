// Constants for Wikidata API
export const WIKIDATA_API_URL = 'https://www.wikidata.org/w/api.php';
export const COMMONS_THUMB_BASE = 'https://commons.wikimedia.org/w/thumb.php';

// Utility function to construct Wikidata API URLs
export function constructWikidataUrl(action: string, params: Record<string, string>) {
  const queryParams = new URLSearchParams({
    action,
    format: 'json',
    ...params,
  });
  return `${WIKIDATA_API_URL}?${queryParams.toString()}`;
}

// Utility function to construct image URLs
export const constructImageUrl = (imageName: string, width: number = 500) => {
  return `${COMMONS_THUMB_BASE}?width=${width}&fname=${encodeURIComponent(imageName)}`;
};

// Function to extract image URL from entity claims
export function extractImageUrl(entity: any, size: number = 200): string {
  if (!entity.claims?.P18) return '';
  
  const imageClaim = entity.claims.P18[0];
  if (!imageClaim?.mainsnak?.datavalue?.value) return '';

  const imageName = imageClaim.mainsnak.datavalue.value;
  const encodedImageName = encodeURIComponent(imageName);
  
  return `https://commons.wikimedia.org/w/thumb.php?width=${size}&fname=${encodedImageName}`;
}

// Function to check if an entity is a philosopher
export function isPhilosopher(entity: any): boolean {
  if (!entity.claims?.P106) return false;

  // P106 is occupation, Q4964182 is philosopher
  return entity.claims.P106.some((claim: any) => 
    claim.mainsnak?.datavalue?.value?.id === 'Q4964182'
  );
} 