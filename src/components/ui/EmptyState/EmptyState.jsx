// components/ui/EmptyState/EmptyState.jsx
import React from 'react';
import styles from './EmptyState.module.scss';

const EmptyState = ({
  icon: Icon,
  title,
  description,
  size = 'default',
  className = '',
  children,
}) => {
  const sizeClass = {
    small: styles.sizeSmall,
    default: '',
    large: styles.sizeLarge,
  }[size];

  return (
    <div className={`${styles.container} ${sizeClass} ${className}`}>
      {Icon && <Icon className={styles.icon} />}
      {title && <h3 className={styles.title}>{title}</h3>}
      {description && <p className={styles.description}>{description}</p>}
      {children}
    </div>
  );
};

export default EmptyState;
