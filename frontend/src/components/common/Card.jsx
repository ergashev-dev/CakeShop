import React from 'react';

const Card = ({
  children,
  hover = false,
  className = '',
  padding = 'p-5 sm:p-6',
  bordered = true,
  ...props
}) => {
  return (
    <div
      className={`bg-white dark:bg-[#16181D] rounded-xl ${padding} ${
        bordered ? 'border border-[#E7E9ED] dark:border-[#272A30]' : ''
      } shadow-card ${
        hover ? 'transition-all duration-200 hover:shadow-hover hover:border-[#D1D5DB]' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
