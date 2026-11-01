export const REVIEW_SLIDES_PER_PAGE = 6;
export const DEVIATION_SLIDES_PER_PAGE = 8;

export function chunkList(list = [], size = REVIEW_SLIDES_PER_PAGE) {
  if (list.length === 0) return [];
  const chunks = [];
  for (let index = 0; index < list.length; index += size) {
    chunks.push(list.slice(index, index + size));
  }
  return chunks;
}

export function getReviewSlideCount(session) {
  const deviationSlides = Math.ceil((session?.items?.length || 0) / DEVIATION_SLIDES_PER_PAGE);
  const awardSlides = session?.categories?.length || 0;
  const itemSlides = Math.ceil((session?.items?.length || 0) / REVIEW_SLIDES_PER_PAGE);
  return Math.max(1, 1 + deviationSlides + awardSlides + itemSlides);
}

export function getReviewSlideLabels(session) {
  const labels = ['Podio'];

  const deviationSlides = Math.ceil((session?.items?.length || 0) / DEVIATION_SLIDES_PER_PAGE);
  for (let index = 0; index < deviationSlides; index++) {
    labels.push(deviationSlides > 1 ? `Deviazione ${index + 1}` : 'Deviazione');
  }

  (session?.categories || []).forEach(category => {
    labels.push(`Premio: ${category.name}`);
  });

  const itemSlides = Math.ceil((session?.items?.length || 0) / REVIEW_SLIDES_PER_PAGE);
  for (let index = 0; index < itemSlides; index++) {
    labels.push(itemSlides > 1 ? `Classifica ${index + 1}` : 'Classifica');
  }

  return labels;
}
