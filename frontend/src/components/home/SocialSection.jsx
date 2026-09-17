import React from 'react';
import { Send, Heart, MessageCircle } from 'lucide-react';
import { InstagramIcon } from '../common/Icons';
import { handleImageError, DEFAULT_CAKE_IMAGE } from '../../utils/imageFallback';

const SocialSection = () => {
  const posts = [
    {
      image: '/cake_strawberry.jpg',
      likes: '1 420',
      comments: '88',
      tag: '#Fraisier #BolTortlari',
    },
    {
      image: '/hero-cake.jpg',
      likes: '3 890',
      comments: '215',
      tag: '#WeddingCake #Fergana',
    },
    {
      image: '/cake_chocolate.jpg',
      likes: '2 150',
      comments: '134',
      tag: '#TruffleCake #BelgianChocolate',
    },
    {
      image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=600&q=80',
      likes: '1 980',
      comments: '92',
      tag: '#PistachioVelvet',
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-amber-50/40 dark:bg-[#121316] border-t border-amber-100/60 dark:border-stone-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-300 text-xs font-semibold mb-3">
              <InstagramIcon className="w-3.5 h-3.5" />
              <span>@boltortlari_uz</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 dark:text-stone-100">
              Bizning Instagram va Ijtimoiy Hayotimiz
            </h2>
            <p className="text-stone-600 dark:text-stone-400 text-sm mt-2">
              Har kuni tayyorlanayotgan yangi shohona asarlarimizni kuzatib boring
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 text-white text-xs font-bold shadow-soft hover:opacity-95 transition-opacity"
            >
              <InstagramIcon className="w-4 h-4" />
              <span>Instagramda kuzatish</span>
            </a>

            <a
              href="https://t.me"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#229ED9] text-white text-xs font-bold shadow-soft hover:opacity-95 transition-opacity"
            >
              <Send className="w-4 h-4" />
              <span>Telegram kanal</span>
            </a>
          </div>
        </div>

        {/* 4 ta Instagram Post Kartochkasi */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {posts.map((post, i) => (
            <div
              key={i}
              className="group relative aspect-square rounded-3xl overflow-hidden shadow-soft bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800"
            >
              <img
                src={post.image || DEFAULT_CAKE_IMAGE}
                alt="Bol Tortlari Instagram post"
                onError={handleImageError}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3 text-white p-4 text-center">
                <div className="flex items-center gap-4 text-xs font-bold">
                  <span className="flex items-center gap-1">
                    <Heart className="w-4 h-4 fill-white" />
                    {post.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4 fill-white" />
                    {post.comments}
                  </span>
                </div>
                <span className="text-[11px] text-amber-300 font-medium">{post.tag}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialSection;
