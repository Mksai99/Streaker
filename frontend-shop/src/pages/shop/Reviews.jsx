import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewApi, shopApi } from '../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MessageCircle, Reply, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function ShopReviews() {
  const qc = useQueryClient();
  const { data: shops } = useQuery({ queryKey: ['myShops'], queryFn: async () => (await shopApi.getMyShops()).data });
  const shopId = shops?.[0]?.shopId;

  const { data: reviewData, isLoading } = useQuery({
    queryKey: ['shopReviews', shopId],
    queryFn: async () => (await reviewApi.getShopReviews(shopId, { limit: 50 })).data,
    enabled: !!shopId
  });

  const reviews = reviewData?.reviews || [];
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  const replyMut = useMutation({
    mutationFn: ({ reviewId, reply }) => reviewApi.replyToReview(reviewId, shopId, reply),
    onSuccess: () => { 
      toast.success('Reply posted'); 
      setReplyingTo(null); 
      setReplyText('');
      qc.invalidateQueries(['shopReviews', shopId]); 
    },
    onError: (e) => toast.error(e.message)
  });

  const handleReplySubmit = (reviewId) => {
    if (!replyText.trim()) return;
    replyMut.mutate({ reviewId, reply: replyText });
  };

  if (isLoading) return <div className="flex justify-center py-40"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;

  return (
    <div className="space-y-6 pb-6 relative">
      <div className="flex items-center gap-3 pt-2 px-1">
        <Link to="/shop/settings" className="p-2 bg-white dark:bg-gray-900 rounded-full shadow-sm active:scale-95 transition-transform">
          <ArrowLeft className="w-5 h-5 text-gray-900 dark:text-white" />
        </Link>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Reviews</h1>
      </div>

      {/* Analytics Summary */}
      <div className="mx-1 bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            {shops?.[0]?.stats?.averageRating || 0} <Star className="w-8 h-8 fill-yellow-400 text-yellow-400" />
          </h2>
          <p className="text-gray-500 text-sm mt-1">{shops?.[0]?.stats?.totalReviews || 0} Total Reviews</p>
        </div>
      </div>

      <div className="mx-1 space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Reviews Yet</h3>
            <p className="text-gray-500 text-sm px-6">Customer reviews will appear here once they rate their visits.</p>
          </div>
        ) : (
          reviews.map((r) => (
            <motion.div key={r.reviewId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
              className="bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    {r.customerAvatar ? <img src={r.customerAvatar} alt={r.customerName} /> : <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">{r.customerName[0]}</div>}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-1">
                      {r.customerName} {r.verifiedVisit && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                    </h4>
                    <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-full items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-bold text-yellow-700 dark:text-yellow-500">{r.rating}</span>
                </div>
              </div>
              
              {r.title && <h5 className="font-bold text-gray-800 dark:text-gray-200 mb-1">{r.title}</h5>}
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 leading-relaxed">{r.comment}</p>
              
              {r.images?.length > 0 && (
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2 hide-scrollbar">
                  {r.images.map((img, i) => (
                    <img key={i} src={img} alt="Review" className="h-20 w-20 object-cover rounded-xl shrink-0 border border-gray-100 dark:border-gray-800" />
                  ))}
                </div>
              )}

              {/* Reply Section */}
              {r.ownerReply ? (
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 mt-4 relative">
                  <div className="absolute -left-2 top-4 w-4 h-4 bg-gray-50 dark:bg-gray-800/50 rotate-45" />
                  <p className="text-xs font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-1"><Reply className="w-3 h-3" /> Shop Response</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{r.ownerReply}</p>
                </div>
              ) : (
                <div className="mt-4">
                  {replyingTo === r.reviewId ? (
                    <div className="flex gap-2">
                      <input autoFocus type="text" value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Type your reply..." className="flex-1 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                      <button onClick={() => handleReplySubmit(r.reviewId)} disabled={replyMut.isPending} className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-full disabled:opacity-50">Post</button>
                      <button onClick={() => setReplyingTo(null)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-bold rounded-full">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => { setReplyingTo(r.reviewId); setReplyText(''); }} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 active:scale-95 transition-transform">
                      <Reply className="w-3.5 h-3.5" /> Reply to customer
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
