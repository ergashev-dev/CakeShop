import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Star, CheckCircle, MessageSquare, Plus, X, Upload, CheckCircle2, Award } from 'lucide-react';
import { reviewApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';
import { handleImageError } from '../../utils/imageFallback';

const Reviews = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ rating: 5, comment: '', photo: '' });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const handleReviewAction = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate('/orders');
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadReviews = async () => {
    try {
      setLoading(true);
      const res = await reviewApi.getAll();
      setReviews(res.data?.reviews || []);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      showToast('Sharh qoldirish uchun tizimga kirishingiz lozim.', 'error');
      return;
    }

    setSubmitLoading(true);
    try {
      const res = await reviewApi.create(form);
      showToast(res.data.message);
      setIsModalOpen(false);
      setForm({ rating: 5, comment: '', photo: '' });
      loadReviews();
    } catch (err) {
      showToast(err.response?.data?.error || 'Sharh yuborishda xatolik.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setForm((p) => ({ ...p, photo: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  return (
    <section id="reviews" className="py-12 sm:py-16 bg-white dark:bg-[#16181D] border-b border-[#E5E7EB] dark:border-[#26282E]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Toast */}
        {toast && (
          <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-xl text-xs font-bold border flex items-center gap-2 animate-in slide-in-from-bottom duration-200 ${
            toast.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}>
            <CheckCircle2 className="w-4 h-4" />
            <span>{toast.msg}</span>
          </div>
        )}

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold text-[#2563EB] uppercase tracking-wider block mb-1">
              {t('reviews.badge', 'Mijozlar fikrlari')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#111827] dark:text-[#F3F4F6] tracking-tight">
              {t('reviews.title', 'Bizga ishonch bildirgan xaridorlar')}
            </h2>
            <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] mt-1.5">
              {t('reviews.subtitle', 'Buyurtmasi yetkazilgan haqiqiy mijozlarning samimiy baholari va fikrlari.')}
            </p>
          </div>

          <Button
            variant="outline"
            icon={Plus}
            size="sm"
            onClick={handleReviewAction}
            className="self-start sm:self-auto"
          >
            {t('cake_details.reviews', 'Fikr bildirish')}
          </Button>
        </div>

        {/* Reviews Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-[#FBFBFC] dark:bg-[#1C1F26] border border-[#E5E7EB] dark:border-[#26282E] rounded-2xl h-48 animate-pulse"
              />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-[#FBFBFC] dark:bg-[#1C1F26] border border-[#E5E7EB] dark:border-[#26282E] rounded-2xl p-12 text-center shadow-subtle">
            <MessageSquare className="w-10 h-10 text-[#9CA3AF] mx-auto mb-2 opacity-40" />
            <h3 className="text-base font-bold text-[#111827] dark:text-[#F3F4F6]">Hozircha sharhlar mavjud emas</h3>
            <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-1 max-w-sm mx-auto mb-4">
              Yetkazilgan buyurtmangiz haqida birinchi bo‘lib o‘z samimiy fikringizni qoldiring!
            </p>
            <Button variant="primary" size="sm" onClick={handleReviewAction}>
              Fikr qoldirish
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((rev) => (
              <div
                key={rev._id}
                className="bg-[#FBFBFC] dark:bg-[#1C1F26] border border-[#E5E7EB] dark:border-[#26282E] rounded-2xl p-6 shadow-subtle hover:shadow-hover transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Stars */}
                  <div className="flex items-center gap-1 text-amber-500 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < (rev.rating || 5)
                            ? 'fill-amber-400 stroke-amber-400'
                            : 'fill-transparent stroke-gray-300'
                        }`}
                      />
                    ))}
                  </div>

                  <p className="text-xs sm:text-sm text-[#374151] dark:text-[#D1D5DB] leading-relaxed mb-4">
                    «{rev.comment}»
                  </p>

                  {/* Photo if present */}
                  {rev.photo && (
                    <img
                      src={rev.photo}
                      alt="Sharh rasmi"
                      onError={handleImageError}
                      className="w-full h-36 object-cover rounded-xl mb-4 border border-[#E5E7EB] dark:border-[#26282E]"
                    />
                  )}

                  {/* Admin Reply */}
                  {rev.adminReply && rev.adminReply.text && (
                    <div className="p-3 rounded-xl bg-[#EFF6FF] dark:bg-[#1E3A8A]/20 border border-[#BFDBFE]/60 dark:border-[#1E3A8A] text-xs mb-4">
                      <div className="font-bold text-[#2563EB] mb-1">
                        Rasmiy javob ({rev.adminReply.adminName || 'Admin'}):
                      </div>
                      <p className="text-[#4B5563] dark:text-[#93C5FD]">
                        {rev.adminReply.text}
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-[#E5E7EB] dark:border-[#26282E] flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 font-semibold text-xs sm:text-sm text-[#111827] dark:text-[#F3F4F6]">
                      <span>{rev.userName}</span>
                      {rev.isVerifiedBuyer && (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" title="Tasdiqlangan xaridor" />
                      )}
                    </div>
                    <div className="text-[11px] text-[#6B7280]">
                      {rev.isVerifiedBuyer ? t('reviews.verified_buyer', 'Tasdiqlangan xaridor') : 'Mijoz'}
                    </div>
                  </div>

                  {rev.orderId && (
                    <span className="text-[10px] font-mono text-[#9CA3AF]">
                      #{rev.orderId}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* LEAVE REVIEW MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#16181D] border border-[#E5E7EB] dark:border-[#26282E] rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-[#6B7280] hover:text-[#111827] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold mb-1">Fikr va Baho Qoldirish</h3>
            <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mb-4">
              Xaridingiz haqida samimiy fikringizni ulashing.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Star Rating Select */}
              <div>
                <label className="text-xs font-bold text-[#6B7280] block mb-2">Baho bering</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, rating: num }))}
                      className="p-1 cursor-pointer focus:outline-none"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          num <= form.rating
                            ? 'fill-amber-400 stroke-amber-400'
                            : 'fill-transparent stroke-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment text */}
              <div>
                <label className="text-xs font-bold text-[#6B7280] block mb-1">Fikringiz *</label>
                <textarea
                  required
                  rows={4}
                  value={form.comment}
                  onChange={(e) => setForm((p) => ({ ...p, comment: e.target.value }))}
                  placeholder="Tortning ta’mi, yetkazib berish xizmati va ko‘rinishi haqida yozing..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] dark:border-[#26282E] bg-[#FBFBFC] dark:bg-[#1E2024] text-xs outline-none"
                />
              </div>

              {/* Photo upload */}
              <div>
                <label className="text-xs font-bold text-[#6B7280] block mb-1">
                  Tort rasmi (Ixtiyoriy)
                </label>
                <div className="border border-dashed border-[#E5E7EB] dark:border-[#26282E] rounded-xl p-3 text-center relative hover:border-[#2563EB] transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  {form.photo ? (
                    <span className="text-xs font-semibold text-emerald-600">Rasm yuklandi</span>
                  ) : (
                    <span className="text-xs text-[#6B7280] flex items-center justify-center gap-1.5">
                      <Upload className="w-3.5 h-3.5" /> Rasm tanlash
                    </span>
                  )}
                </div>
              </div>

              <Button variant="primary" type="submit" loading={submitLoading} className="w-full">
                Sharhni yuborish
              </Button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default Reviews;
