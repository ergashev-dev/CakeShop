import React from 'react';
import Hero from '../../components/home/Hero';
import PopularCakes from '../../components/home/PopularCakes';
import WhyUs from '../../components/home/WhyUs';
import CustomCakeCTA from '../../components/home/CustomCakeCTA';
import HowItWorks from '../../components/home/HowItWorks';
import Reviews from '../../components/home/Reviews';
import DeliverySection from '../../components/home/DeliverySection';

const HomePage = () => {
  return (
    <div className="flex-1">
      {/* 1. Hero */}
      <Hero />

      {/* 2. Popular Cakes */}
      <PopularCakes />

      {/* 3. Why Choose Us */}
      <WhyUs />

      {/* 4. Custom Cake Builder CTA */}
      <CustomCakeCTA />

      {/* 5. How It Works (3 steps) */}
      <HowItWorks />

      {/* 6. Customer Reviews */}
      <Reviews />

      {/* 7. Delivery & Coverage */}
      <DeliverySection />
    </div>
  );
};

export default HomePage;
