/**
 * High-resolution fallback pastry images to replace any broken or missing image links.
 * Prevents browser broken-image icons from ever appearing.
 */
export const FALLBACK_CAKE_IMAGES = [
  'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535141192574-5d4897c13136?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=800&auto=format&fit=crop&q=80',
];

export const DEFAULT_CAKE_IMAGE = FALLBACK_CAKE_IMAGES[0];

/**
 * Handle image load error seamlessly
 */
export const handleImageError = (e, fallback = DEFAULT_CAKE_IMAGE) => {
  if (e.currentTarget.src !== fallback) {
    e.currentTarget.onerror = null; // Prevent loop
    e.currentTarget.src = fallback;
  }
};
