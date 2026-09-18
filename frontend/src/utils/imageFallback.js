/**
 * High-resolution fallback pastry images to replace any broken or missing image links.
 * Prevents browser broken-image icons from ever appearing.
 */
export const FALLBACK_CAKE_IMAGES = [
  '/cake_chocolate.jpg',
  '/cake_strawberry.jpg',
  '/hero-cake.jpg',
  '/og-image.jpg',
];

export const DEFAULT_CAKE_IMAGE = '/cake_chocolate.jpg';

/**
 * Handle image load error seamlessly
 */
export const handleImageError = (e, fallback = DEFAULT_CAKE_IMAGE) => {
  if (e.currentTarget.src !== fallback) {
    e.currentTarget.onerror = null; // Prevent loop
    e.currentTarget.src = fallback;
  }
};
