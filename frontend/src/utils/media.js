const BACKEND_ORIGIN = `${window.location.protocol}//${window.location.hostname}:3001`;

export function mediaUrl(value) {
  if (!value || typeof value !== 'string') return value;
  if (value.startsWith('/api/uploads/')) return `${BACKEND_ORIGIN}${value}`;
  return value;
}

export function isImageSource(value) {
  if (!value || typeof value !== 'string') return false;
  return value.startsWith('data:image')
    || value.startsWith('blob:')
    || value.startsWith('/api/uploads/')
    || value.startsWith('http://')
    || value.startsWith('https://');
}
