import React from 'react';

const Badge = ({ variant = 'primary', children, style = {} }) => {
  return (
    <span className={`badge badge-${variant}`} style={style}>
      {children}
    </span>
  );
};

export default Badge;
