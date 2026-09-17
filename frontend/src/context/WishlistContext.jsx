import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { userApi, cakeApi } from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);

  // Helper to load guest favorites from localStorage
  const loadGuestFavorites = useCallback(async () => {
    try {
      const stored = localStorage.getItem('bol_tortlari_wishlist');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // If stored is an array of IDs, try to fetch/match or keep lightweight objects
          setFavorites(parsed);
        }
      } else {
        setFavorites([]);
      }
    } catch (e) {
      setFavorites([]);
    }
  }, []);

  // Fetch favorites from API for logged-in user
  const fetchFavorites = useCallback(async () => {
    if (!user) {
      loadGuestFavorites();
      return;
    }
    setLoading(true);
    try {
      const res = await userApi.getFavorites();
      const favList = res.data?.favorites || [];
      setFavorites(favList);
    } catch (err) {
      console.warn('Could not load user favorites, falling back to local:', err);
      loadGuestFavorites();
    } finally {
      setLoading(false);
    }
  }, [user, loadGuestFavorites]);

  // Sync guest favorites to server once user logs in
  useEffect(() => {
    const syncLocalFavoritesOnLogin = async () => {
      if (user) {
        try {
          const stored = localStorage.getItem('bol_tortlari_wishlist');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
              // Toggle each local favorite to backend if not already there
              for (const item of parsed) {
                const itemId = typeof item === 'object' ? item._id || item.id : item;
                if (itemId) {
                  await userApi.toggleFavorite(itemId).catch(() => {});
                }
              }
              localStorage.removeItem('bol_tortlari_wishlist');
            }
          }
        } catch (e) {}
        fetchFavorites();
      } else {
        loadGuestFavorites();
      }
    };

    syncLocalFavoritesOnLogin();
  }, [user, fetchFavorites, loadGuestFavorites]);

  // Check if a cake is in favorites
  const isFavorite = useCallback(
    (cakeId) => {
      if (!cakeId) return false;
      const targetId = cakeId.toString();
      return favorites.some((f) => {
        const favId = (typeof f === 'object' ? f._id || f.id : f)?.toString();
        return favId === targetId;
      });
    },
    [favorites]
  );

  // Toggle favorite
  const toggleFavorite = useCallback(
    async (cake) => {
      if (!cake) return;
      const cakeId = cake._id || cake.id;
      if (!cakeId) return;

      const currentlyFav = isFavorite(cakeId);
      const cakeName = cake.name || 'Mahsulot';

      if (user) {
        try {
          // Optimistic local update
          let nextFavs;
          if (currentlyFav) {
            nextFavs = favorites.filter((f) => {
              const fid = (typeof f === 'object' ? f._id || f.id : f)?.toString();
              return fid !== cakeId.toString();
            });
            toast.info(`${cakeName} sevimlilardan olib tashlandi.`);
          } else {
            nextFavs = [...favorites, cake];
            toast.success(`${cakeName} sevimlilarga qo‘shildi! ❤️`);
          }
          setFavorites(nextFavs);

          // Server sync
          const res = await userApi.toggleFavorite(cakeId);
          if (res.data?.favorites) {
            setFavorites(res.data.favorites);
          }
        } catch (err) {
          console.error('Toggle favorite API error:', err);
          fetchFavorites();
        }
      } else {
        // Guest mode with localStorage
        try {
          let updated;
          if (currentlyFav) {
            updated = favorites.filter((f) => {
              const fid = (typeof f === 'object' ? f._id || f.id : f)?.toString();
              return fid !== cakeId.toString();
            });
            toast.info(`${cakeName} sevimlilardan olib tashlandi.`);
          } else {
            updated = [...favorites, cake];
            toast.success(`${cakeName} sevimlilarga qo‘shildi! ❤️`);
          }
          setFavorites(updated);
          localStorage.setItem('bol_tortlari_wishlist', JSON.stringify(updated));
        } catch (e) {
          console.error('Local storage wishlist error:', e);
        }
      }
    },
    [user, favorites, isFavorite, toast, fetchFavorites]
  );

  const removeFavorite = useCallback(
    async (cakeId) => {
      const cake = favorites.find((f) => {
        const fid = (typeof f === 'object' ? f._id || f.id : f)?.toString();
        return fid === cakeId?.toString();
      });
      if (cake) {
        await toggleFavorite(cake);
      }
    },
    [favorites, toggleFavorite]
  );

  return (
    <WishlistContext.Provider
      value={{
        favorites,
        wishlistCount: favorites.length,
        loading,
        isFavorite,
        toggleFavorite,
        removeFavorite,
        fetchFavorites,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
