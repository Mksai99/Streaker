import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api, rewardApi, galleryApi, reviewApi } from '../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, MapPin, ChevronLeft, Gift, Tag, Package, Loader2, Phone, Globe, Clock, Star, MessageCircle, Send, User } from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';
import { getRewardTypeLabel } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

export default function ShopDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: shop, isLoading: shopLoading } = useQuery({
    queryKey: ['shop', id],
    queryFn: async () => (await api.get(`/shops/${id}`)).data
  });

  const { data: products } = useQuery({
    queryKey: ['shopProducts', id],
    queryFn: async () => (await api.get(`/products/shop/${id}`)).data
  });

  const { data: offers } = useQuery({
    queryKey: ['shopOffers', id],
    queryFn: async () => (await api.get(`/offers/shop/${id}`)).data.data
  });

  const { data: rewards } = useQuery({
    queryKey: ['shopRewards', id],
    queryFn: async () => (await api.get(`/rewards/shop/${id}`)).data.rewards
  });

  const { data: analytics } = useQuery({
    queryKey: ['customerAnalytics'],
    queryFn: async () => (await api.get(`/analytics/customer`)).data
  });

  const { data: gallery } = useQuery({
    queryKey: ['shopGallery', id],
    queryFn: async () => (await galleryApi.getGallery(id)).data
  });

  const { data: reviewData } = useQuery({
    queryKey: ['shopReviews', id],
    queryFn: async () => (await reviewApi.getShopReviews(id, { limit: 50 })).data
  });
  const reviews = reviewData?.reviews || [];

  const [activeImage, setActiveImage] = useState(0);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const queryClient = useQueryClient();

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewForm.comment.trim()) return;
    setIsSubmittingReview(true);
    try {
      await reviewApi.addReview(id, reviewForm);
      toast.success('Review posted successfully!');
      queryClient.invalidateQueries(['shopReviews', id]);
      setReviewForm({ rating: 5, comment: '' });
    } catch (err) {
      toast.error(err.message || 'Failed to post review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (shopLoading) return <div className="flex justify-center py-40"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
  if (!shop) return <div className="text-center py-20">Shop not found</div>;

  const currentStreak = analytics?.currentStreak || user?.currentStreak || 0;

  return (
    <div className="pb-24">
      {/* Cover Header / Gallery Carousel */}
      <div className="relative h-64 bg-gray-200 dark:bg-gray-800 overflow-hidden">
        {gallery?.length > 0 ? (
          <div className="w-full h-full relative group">
            <AnimatePresence initial={false} custom={activeImage}>
              <motion.img
                key={activeImage}
                src={gallery[activeImage].url}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 pointer-events-none" />
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-10">
              {gallery.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${idx === activeImage ? 'bg-white w-4' : 'bg-white/50'}`}
                />
              ))}
            </div>
            {/* Quick left/right arrows for desktop */}
            <button onClick={() => setActiveImage(p => p > 0 ? p - 1 : gallery.length - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/20 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><ChevronLeft className="w-5 h-5" /></button>
            <button onClick={() => setActiveImage(p => p < gallery.length - 1 ? p + 1 : 0)} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/20 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><ChevronLeft className="w-5 h-5 rotate-180" /></button>
          </div>
        ) : shop.coverImage ? (
          <img src={shop.coverImage} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-indigo-500 to-purple-500">
             <Store className="w-16 h-16 text-white/50" />
          </div>
        )}
        <div className="absolute top-0 left-0 right-0 p-4 pt-6 bg-gradient-to-b from-black/50 to-transparent z-20 pointer-events-none">
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white active:scale-95 transition-transform pointer-events-auto">
            <ChevronLeft className="w-6 h-6 pr-1" />
          </button>
        </div>
        <div className="absolute -bottom-10 left-6 z-20">
          <div className="w-24 h-24 bg-white dark:bg-gray-900 rounded-2xl p-1 shadow-xl">
            <div className="w-full h-full bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden flex items-center justify-center">
              {shop.logo ? <img src={shop.logo} className="w-full h-full object-cover" /> : <Store className="w-8 h-8 text-gray-400" />}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pt-14 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">{shop.name}</h1>
          <p className="text-sm text-gray-500 mt-1">{shop.description}</p>
          
          <div className="flex flex-wrap gap-3 mt-4">
            {shop.address && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg">
                <MapPin className="w-4 h-4 text-emerald-500" /> {shop.city || 'Location'}
              </div>
            )}
            {shop.openingTime && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg">
                <Clock className="w-4 h-4 text-orange-500" /> {shop.openingTime} - {shop.closingTime}
              </div>
            )}
          </div>
        </div>

        {/* User's Streak at this shop */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-5 text-white shadow-lg relative overflow-hidden">
           <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-white/80 font-bold text-xs uppercase tracking-wider mb-1">Your Streak</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black">{currentStreak}</span>
                  <span className="text-sm font-semibold text-white/80">days</span>
                </div>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <span className="text-3xl">🔥</span>
              </div>
           </div>
        </div>

        <Tabs.Root defaultValue="rewards">
          <Tabs.List className="flex overflow-x-auto hide-scrollbar p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-6 gap-1">
            <Tabs.Trigger value="rewards" className="flex-1 min-w-[80px] py-2.5 text-sm font-bold rounded-lg transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm text-gray-500 dark:text-gray-400">Rewards</Tabs.Trigger>
            <Tabs.Trigger value="offers" className="flex-1 min-w-[80px] py-2.5 text-sm font-bold rounded-lg transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm text-gray-500 dark:text-gray-400">Offers</Tabs.Trigger>
            <Tabs.Trigger value="products" className="flex-1 min-w-[80px] py-2.5 text-sm font-bold rounded-lg transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm text-gray-500 dark:text-gray-400">Products</Tabs.Trigger>
            <Tabs.Trigger value="reviews" className="flex-1 min-w-[80px] py-2.5 text-sm font-bold rounded-lg transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm text-gray-500 dark:text-gray-400">Reviews</Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="rewards" className="space-y-4">
            {rewards?.length > 0 ? (
              rewards.map((r, i) => (
                <motion.div key={r.rewardId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-white dark:bg-gray-900 rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex gap-4 items-center">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${currentStreak >= r.requiredStreak ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-500' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                    <Gift className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 dark:text-white">{r.name}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">{getRewardTypeLabel(r.rewardType)}</p>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full mt-2 overflow-hidden">
                      <div className={`h-full rounded-full ${currentStreak >= r.requiredStreak ? 'bg-indigo-500' : 'bg-gray-400'}`} style={{ width: `${Math.min((currentStreak / r.requiredStreak) * 100, 100)}%` }} />
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-center">
                    <span className="text-sm font-black text-gray-900 dark:text-white">{r.requiredStreak}</span>
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Days</span>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-3xl"><p className="text-sm text-gray-500">No active rewards</p></div>
            )}
          </Tabs.Content>

          <Tabs.Content value="offers" className="space-y-4">
            {offers?.length > 0 ? (
              offers.map((o, i) => (
                <motion.div key={o.offerId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-emerald-50 dark:bg-emerald-900/10 rounded-3xl p-4 border border-emerald-100 dark:border-emerald-900/30">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <Tag className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-emerald-900 dark:text-emerald-300 leading-tight">{o.title}</h4>
                      <p className="text-sm text-emerald-700/80 dark:text-emerald-500/80 mt-1">{o.description}</p>
                      {o.couponCode && (
                        <div className="mt-3 inline-block border-2 border-dashed border-emerald-300 dark:border-emerald-700/50 bg-white dark:bg-gray-900 px-3 py-1 rounded-lg font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm tracking-widest">
                          {o.couponCode}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-3xl"><p className="text-sm text-gray-500">No active offers</p></div>
            )}
          </Tabs.Content>

          <Tabs.Content value="products" className="space-y-4">
             {products?.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {products.map((p, i) => (
                  <motion.div key={p.productId} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                    className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm flex flex-col">
                    
                    <div className="relative aspect-square bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-x-auto snap-x snap-mandatory hide-scrollbar">
                      {p.images && p.images.length > 0 ? (
                        <div className="flex w-full h-full">
                          {p.images.map((img, idx) => (
                            <img key={idx} src={img} className="w-full h-full object-cover shrink-0 snap-center" alt={`${p.name} image ${idx + 1}`} />
                          ))}
                        </div>
                      ) : p.image ? (
                        <img src={p.image} className="w-full h-full object-cover shrink-0 snap-center" alt={p.name} />
                      ) : (
                        <Package className="w-8 h-8 text-gray-400 shrink-0 snap-center" />
                      )}
                      
                      {/* Dots for multiple images */}
                      {p.images && p.images.length > 1 && (
                        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 pointer-events-none">
                          {p.images.map((_, idx) => (
                            <div key={idx} className="w-1.5 h-1.5 rounded-full bg-white/70 shadow-sm" />
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="p-3">
                      <h5 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1">{p.name}</h5>
                      <span className="text-indigo-600 dark:text-indigo-400 font-black text-sm block mt-1">₹{p.price}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
             ) : (
               <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-3xl"><p className="text-sm text-gray-500">No products listed</p></div>
             )}
          </Tabs.Content>
          <Tabs.Content value="reviews" className="space-y-6">
            {/* Review Analytics Header */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="text-4xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                  {shop.stats?.averageRating || 0} <Star className="w-8 h-8 fill-yellow-400 text-yellow-400" />
                </h3>
                <p className="text-sm text-gray-500 font-medium mt-1">{shop.stats?.totalReviews || 0} Reviews</p>
              </div>
            </div>

            {/* Write a Review Form */}
            {currentStreak > 0 && !reviews.find(r => r.userId === user?.uid) && (
              <form onSubmit={handleReviewSubmit} className="bg-indigo-50 dark:bg-indigo-900/10 rounded-3xl p-5 border border-indigo-100 dark:border-indigo-900/30">
                <h4 className="font-bold text-indigo-900 dark:text-indigo-300 mb-3">Rate your experience</h4>
                <div className="flex gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      className="focus:outline-none"
                    >
                      <Star className={`w-8 h-8 transition-colors ${star <= reviewForm.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} />
                    </button>
                  ))}
                </div>
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  placeholder="Share details of your experience at this shop..."
                  className="w-full bg-white dark:bg-gray-900 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24 mb-3 text-gray-900 dark:text-white"
                  required
                />
                <button
                  type="submit"
                  disabled={isSubmittingReview || !reviewForm.comment.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isSubmittingReview ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Post Review</>}
                </button>
              </form>
            )}

            {/* Review List */}
            <div className="space-y-4">
              {reviews.length > 0 ? (
                reviews.map((r) => (
                  <div key={r.reviewId} className="bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {r.customerAvatar ? <img src={r.customerAvatar} alt={r.customerName} className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-gray-400" />}
                        </div>
                        <div>
                          <h5 className="font-bold text-gray-900 dark:text-white text-sm">{r.customerName}</h5>
                          <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-full items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-bold text-yellow-700 dark:text-yellow-500">{r.rating}</span>
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{r.comment}</p>
                    
                    {r.ownerReply && (
                      <div className="mt-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 relative">
                        <div className="absolute -left-2 top-4 w-4 h-4 bg-gray-50 dark:bg-gray-800/50 rotate-45" />
                        <p className="text-xs font-bold text-gray-900 dark:text-white mb-1">Shop Response</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{r.ownerReply}</p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-3xl">
                  <MessageCircle className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-sm text-gray-500">No reviews yet. Be the first to review!</p>
                </div>
              )}
            </div>
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </div>
  );
}
