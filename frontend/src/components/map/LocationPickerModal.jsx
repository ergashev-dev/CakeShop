import React, { useEffect, useRef, useState } from 'react';
import { X, MapPin, Navigation, Check, Loader2, AlertCircle } from 'lucide-react';
import Button from '../common/Button';

// Dynamically load Leaflet assets if not present
const loadLeafletAssets = () => {
  return new Promise((resolve, reject) => {
    if (window.L) {
      return resolve(window.L);
    }

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }

    if (!document.getElementById('leaflet-js')) {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      script.crossOrigin = '';
      script.onload = () => resolve(window.L);
      script.onerror = (err) => reject(err);
      document.body.appendChild(script);
    } else {
      const checkInterval = setInterval(() => {
        if (window.L) {
          clearInterval(checkInterval);
          resolve(window.L);
        }
      }, 50);
    }
  });
};

const LocationPickerModal = ({ isOpen, onClose, onSelectLocation, initialAddress = '' }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const [loadingMap, setLoadingMap] = useState(true);
  const [detectingGps, setDetectingGps] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [currentCoords, setCurrentCoords] = useState({ lat: 41.2995, lng: 69.2401 }); // Default: Tashkent center
  const [detectedAddress, setDetectedAddress] = useState(initialAddress || '');
  const [gpsError, setGpsError] = useState('');

  // Reverse geocode lat/lng to readable address via Nominatim
  const reverseGeocode = async (lat, lon) => {
    setGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'uz,ru,en',
          },
        }
      );
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        const road = addr.road || addr.street || addr.pedestrian || addr.neighbourhood || '';
        const house = addr.house_number ? `${addr.house_number}-uy` : '';
        const district = addr.suburb || addr.city_district || addr.county || addr.district || '';
        const city = addr.city || addr.town || addr.state || 'Toshkent';

        const parts = [city, district, road, house].filter(Boolean);
        const full = parts.length > 0 ? parts.join(', ') : data.display_name?.split(',').slice(0, 3).join(',') || '';
        setDetectedAddress(full);
      } else {
        setDetectedAddress(`Koordinatalar: ${lat.toFixed(5)}, ${lon.toFixed(5)}`);
      }
    } catch (err) {
      console.warn('Geocoding error:', err);
      setDetectedAddress(`Koordinatalar: ${lat.toFixed(5)}, ${lon.toFixed(5)}`);
    } finally {
      setGeocoding(false);
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoadingMap(true);
    setGpsError('');

    loadLeafletAssets()
      .then((L) => {
        if (!isMounted || !mapContainerRef.current) return;

        // Custom marker icon
        const customIcon = L.divIcon({
          className: 'custom-map-pin',
          html: `
            <div style="
              width: 38px;
              height: 38px;
              background: #2563EB;
              border: 3px solid white;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              box-shadow: 0 4px 12px rgba(37,99,235,0.45);
              display: flex;
              align-items: center;
              justify-content: center;
              position: relative;
            ">
              <div style="
                width: 14px;
                height: 14px;
                background: white;
                border-radius: 50%;
                transform: rotate(45deg);
              "></div>
            </div>
          `,
          iconSize: [38, 38],
          iconAnchor: [19, 38],
          popupAnchor: [0, -36],
        });

        // Destroy previous instance if exists
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        const map = L.map(mapContainerRef.current, {
          center: [currentCoords.lat, currentCoords.lng],
          zoom: 15,
          zoomControl: false,
        });

        // Add sleek zoom control
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        // OpenStreetMap Carto tiles (fast, beautiful)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap',
        }).addTo(map);

        // Draggable marker
        const marker = L.marker([currentCoords.lat, currentCoords.lng], {
          icon: customIcon,
          draggable: true,
        }).addTo(map);

        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          setCurrentCoords({ lat: pos.lat, lng: pos.lng });
          reverseGeocode(pos.lat, pos.lng);
        });

        map.on('click', (e) => {
          marker.setLatLng(e.latlng);
          setCurrentCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
          reverseGeocode(e.latlng.lat, e.latlng.lng);
        });

        mapInstanceRef.current = map;
        markerRef.current = marker;

        setTimeout(() => {
          map.invalidateSize();
          setLoadingMap(false);
          // Initial reverse geocode if no address yet
          if (!detectedAddress) {
            reverseGeocode(currentCoords.lat, currentCoords.lng);
          }
        }, 150);
      })
      .catch((err) => {
        console.error('Failed to load Leaflet:', err);
        setLoadingMap(false);
        setGpsError('Xaritani yuklashda xatolik yuz berdi. Internet ulanishini tekshiring.');
      });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen]);

  // Handle GPS location detection
  const handleDetectGPS = () => {
    if (!('geolocation' in navigator)) {
      setGpsError('Qurilmangizda geolokatsiya qo‘llab-quvvatlanmaydi.');
      return;
    }

    setDetectingGps(true);
    setGpsError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCurrentCoords({ lat: latitude, lng: longitude });

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 17, { duration: 1.2 });
          markerRef.current.setLatLng([latitude, longitude]);
        }

        reverseGeocode(latitude, longitude);
        setDetectingGps(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setDetectingGps(false);
        if (err.code === 1) {
          setGpsError('Geolokatsiyaga ruxsat berilmadi. Iltimos brauzer sozlamalarida ruxsat bering.');
        } else {
          setGpsError('Joylashuvingizni aniqlab bo‘lmadi. Xaritadan o‘zingiz belgilang.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleConfirm = () => {
    if (onSelectLocation) {
      onSelectLocation({
        address: detectedAddress || `Koordinatalar: ${currentCoords.lat.toFixed(5)}, ${currentCoords.lng.toFixed(5)}`,
        lat: currentCoords.lat,
        lng: currentCoords.lng,
      });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#16181D] rounded-2xl shadow-2xl border border-[#E5E7EB] dark:border-[#26282E] overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E5E7EB] dark:border-[#26282E] flex items-center justify-between bg-[#F9FAFB] dark:bg-[#1A1C22]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] dark:bg-[#1E3A8A]/30 text-[#2563EB] flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#111827] dark:text-[#F3F4F6]">
                Yetkazib berish manzilini tanlang
              </h3>
              <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">
                Pinni aniq uyingiz yoki eshigingiz ustiga qo‘ying
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#6B7280] hover:bg-[#E5E7EB] dark:hover:bg-[#26282E] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Map Canvas Container */}
        <div className="relative w-full h-80 sm:h-96 bg-[#F3F4F6] dark:bg-[#1C1F26]">
          {loadingMap && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 dark:bg-[#16181D]/80 backdrop-blur-xs">
              <Loader2 className="w-8 h-8 animate-spin text-[#2563EB] mb-2" />
              <span className="text-xs font-semibold text-[#6B7280]">Xarita yuklanmoqda...</span>
            </div>
          )}

          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Quick GPS Floating Button */}
          <button
            type="button"
            onClick={handleDetectGPS}
            disabled={detectingGps}
            className="absolute top-3 right-3 z-[400] flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-[#16181D] text-[#2563EB] text-xs font-bold shadow-lg border border-[#E5E7EB] dark:border-[#26282E] hover:bg-[#EFF6FF] dark:hover:bg-[#1E3A8A]/20 transition-all cursor-pointer active:scale-95"
            title="Joriy joylashuvimni aniqlash"
          >
            {detectingGps ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Navigation className="w-4 h-4 fill-current" />
            )}
            <span>{detectingGps ? 'Aniqlanmoqda...' : 'Joriy joylashuvim'}</span>
          </button>
        </div>

        {/* Selected Address Display & Confirmation */}
        <div className="p-4 sm:p-5 border-t border-[#E5E7EB] dark:border-[#26282E] bg-white dark:bg-[#16181D] space-y-3">
          {gpsError && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{gpsError}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider block">
              Tanlangan manzil
            </label>
            <div className="relative">
              <input
                type="text"
                value={detectedAddress}
                onChange={(e) => setDetectedAddress(e.target.value)}
                placeholder="Manzil: shahar, tuman, ko‘cha, xonadon..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] dark:border-[#26282E] bg-[#F9FAFB] dark:bg-[#1C1F26] text-xs sm:text-sm font-semibold text-[#111827] dark:text-[#F3F4F6] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all"
              />
              {geocoding && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#2563EB]" />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-1">
            <Button variant="secondary" size="md" onClick={onClose}>
              Bekor qilish
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={Check}
              onClick={handleConfirm}
              disabled={!detectedAddress || geocoding}
            >
              Shu manzilni tanlash
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LocationPickerModal;
