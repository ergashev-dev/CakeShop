import React from 'react';

/**
 * Product Cake Card Skeleton matching CakeCard.jsx structure
 */
export const CakeCardSkeleton = () => {
  return (
    <div className="bg-white dark:bg-[#16181D] border border-[#E5E7EB] dark:border-[#26282E] rounded-2xl overflow-hidden shadow-subtle flex flex-col justify-between animate-pulse">
      <div>
        {/* Image Skeleton */}
        <div className="aspect-[4/3] w-full bg-[#E5E7EB] dark:bg-[#26282E]" />

        {/* Content Skeleton */}
        <div className="p-4 sm:p-4.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="h-3 w-12 bg-[#E5E7EB] dark:bg-[#26282E] rounded-md" />
            <div className="h-3 w-16 bg-[#E5E7EB] dark:bg-[#26282E] rounded-md" />
          </div>
          <div className="h-4.5 w-4/5 bg-[#E5E7EB] dark:bg-[#26282E] rounded-md" />
          <div className="h-3 w-3/5 bg-[#E5E7EB] dark:bg-[#26282E] rounded-md" />
        </div>
      </div>

      {/* Footer Skeleton */}
      <div className="p-4 sm:p-4.5 pt-0 mt-auto">
        <div className="pt-3 border-t border-[#F3F4F6] dark:border-[#24272D] flex items-center justify-between">
          <div className="space-y-1">
            <div className="h-2.5 w-10 bg-[#E5E7EB] dark:bg-[#26282E] rounded" />
            <div className="h-4 w-20 bg-[#E5E7EB] dark:bg-[#26282E] rounded" />
          </div>
          <div className="h-8 w-20 bg-[#E5E7EB] dark:bg-[#26282E] rounded-xl" />
        </div>
      </div>
    </div>
  );
};

/**
 * Category pills row skeleton
 */
export const CategorySkeleton = () => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar animate-pulse">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="h-8 w-24 bg-[#E5E7EB] dark:bg-[#26282E] rounded-lg shrink-0"
        />
      ))}
    </div>
  );
};

/**
 * Order item card skeleton
 */
export const OrderSkeleton = () => {
  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-[#16181D] border border-[#E5E7EB] dark:border-[#26282E] space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-4 w-28 bg-[#E5E7EB] dark:bg-[#26282E] rounded" />
          <div className="h-3 w-36 bg-[#E5E7EB] dark:bg-[#26282E] rounded" />
        </div>
        <div className="h-6 w-24 bg-[#E5E7EB] dark:bg-[#26282E] rounded-full" />
      </div>

      <div className="space-y-2 pt-2 border-t border-[#E5E7EB] dark:border-[#26282E]">
        <div className="h-3.5 w-3/4 bg-[#E5E7EB] dark:bg-[#26282E] rounded" />
        <div className="h-3.5 w-1/2 bg-[#E5E7EB] dark:bg-[#26282E] rounded" />
      </div>

      <div className="pt-2 flex items-center justify-between border-t border-[#E5E7EB] dark:border-[#26282E]">
        <div className="h-4 w-20 bg-[#E5E7EB] dark:bg-[#26282E] rounded" />
        <div className="h-4 w-28 bg-[#E5E7EB] dark:bg-[#26282E] rounded" />
      </div>
    </div>
  );
};

/**
 * User Profile page skeleton
 */
export const ProfileSkeleton = () => {
  return (
    <div className="space-y-6 animate-pulse max-w-2xl mx-auto p-4">
      {/* Avatar Header */}
      <div className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-[#16181D] border border-[#E5E7EB] dark:border-[#26282E]">
        <div className="w-16 h-16 rounded-full bg-[#E5E7EB] dark:bg-[#26282E] shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-4.5 w-40 bg-[#E5E7EB] dark:bg-[#26282E] rounded" />
          <div className="h-3 w-28 bg-[#E5E7EB] dark:bg-[#26282E] rounded" />
        </div>
      </div>

      {/* Form Fields */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#16181D] border border-[#E5E7EB] dark:border-[#26282E] space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3 w-24 bg-[#E5E7EB] dark:bg-[#26282E] rounded" />
            <div className="h-10 w-full bg-[#E5E7EB] dark:bg-[#26282E] rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Search modal result item skeleton
 */
export const SearchSkeleton = () => {
  return (
    <div className="p-3 space-y-2 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-2.5 rounded-xl bg-stone-50 dark:bg-[#1F2228]"
        >
          <div className="w-12 h-12 rounded-lg bg-[#E5E7EB] dark:bg-[#26282E] shrink-0" />
          <div className="space-y-1.5 flex-1">
            <div className="h-3.5 w-3/5 bg-[#E5E7EB] dark:bg-[#26282E] rounded" />
            <div className="h-3 w-2/5 bg-[#E5E7EB] dark:bg-[#26282E] rounded" />
          </div>
          <div className="h-4 w-16 bg-[#E5E7EB] dark:bg-[#26282E] rounded shrink-0" />
        </div>
      ))}
    </div>
  );
};

/**
 * Admin Dashboard statistics & table skeleton
 */
export const DashboardSkeleton = () => {
  return (
    <div className="space-y-6 animate-pulse p-4">
      {/* 4 Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-4 rounded-2xl bg-white dark:bg-[#16181D] border border-[#E5E7EB] dark:border-[#26282E] space-y-2"
          >
            <div className="h-3 w-20 bg-[#E5E7EB] dark:bg-[#26282E] rounded" />
            <div className="h-6 w-32 bg-[#E5E7EB] dark:bg-[#26282E] rounded" />
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#16181D] border border-[#E5E7EB] dark:border-[#26282E] space-y-3">
        <div className="h-4 w-36 bg-[#E5E7EB] dark:bg-[#26282E] rounded mb-4" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 w-full bg-[#E5E7EB] dark:bg-[#26282E] rounded-xl" />
        ))}
      </div>
    </div>
  );
};

export default {
  CakeCardSkeleton,
  CategorySkeleton,
  OrderSkeleton,
  ProfileSkeleton,
  SearchSkeleton,
  DashboardSkeleton,
};
