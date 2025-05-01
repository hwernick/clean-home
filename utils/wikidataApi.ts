// Constants for Wikidata API
export const WIKIDATA_API_BASE = 'https://www.wikidata.org/w/api.php';
export const COMMONS_THUMB_BASE = 'https://commons.wikimedia.org/w/thumb.php';

// Utility function to construct Wikidata API URLs
export const constructWikidataUrl = (action: string, params: Record<string, string>) => {
  const baseParams = {
    action,
    format: 'json',
    origin: '*',
    ...params
  };
  const queryString = Object.entries(baseParams)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
  return `${WIKIDATA_API_BASE}?${queryString}`;
};

// Utility function to construct image URLs
export const constructImageUrl = (imageName: string, width: number = 500) => {
  return `${COMMONS_THUMB_BASE}?width=${width}&fname=${encodeURIComponent(imageName)}`;
};

// Function to extract image URL from entity claims
export const extractImageUrl = (entity: any, width: number = 500): string => {
  if (entity.claims?.P18) {
    const imageClaim = entity.claims.P18[0];
    if (imageClaim.mainsnak?.datavalue?.value) {
      const imageName = imageClaim.mainsnak.datavalue.value;
      return constructImageUrl(imageName, width);
    }
  }
  return '';
};

// Function to check if an entity is a philosopher
export const isPhilosopher = (entity: any): boolean => {
  const occupations = entity.claims?.P106 || [];
  return occupations.some((claim: any) => 
    claim.mainsnak?.datavalue?.value?.id === 'Q4964182'
  );
}; 