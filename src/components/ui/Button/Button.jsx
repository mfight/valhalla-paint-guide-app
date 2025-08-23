// components/ui/Button/Button.jsx
import React, { memo, forwardRef } from 'react';
import Icon from '../Icon';
import styles from './Button.module.scss';

const Button = memo(
  forwardRef(
    (
      {
        children,
        variant = 'primary', // 'primary', 'secondary', 'outline', 'ghost', 'danger', 'icon'
        size = 'md', // 'xs', 'sm', 'md', 'lg', 'xl'
        disabled = false,
        loading = false,
        fullWidth = false,
        leftIcon,
        rightIcon,
        theme, // 'light', 'dark' - force specific theme
        padding = 'normal', // For icon variant: 'normal', 'none' - controls icon scaling vs padding
        className = '',
        type = 'button',
        onClick,
        onKeyDown,
        'aria-label': ariaLabel,
        'aria-describedby': ariaDescribedBy,
        ...props
      },
      ref
    ) => {
      // Build class names
      const variantClass = {
        primary: styles.variantPrimary,
        secondary: styles.variantSecondary,
        outline: styles.variantOutline,
        ghost: styles.variantGhost,
        danger: styles.variantDanger,
        icon: styles.variantIcon,
      }[variant];

      const sizeClass = {
        xs: styles.sizeXs,
        sm: styles.sizeSm,
        md: styles.sizeMd,
        lg: styles.sizeLg,
        xl: styles.sizeXl,
      }[size];

      const themeClass = theme
        ? styles[`theme${theme.charAt(0).toUpperCase()}${theme.slice(1)}`]
        : '';

      // Add padding class for icon variant
      const paddingClass =
        variant === 'icon' && padding === 'none' ? styles.iconNoPadding : '';

      const buttonClasses = [
        styles.button,
        variantClass,
        sizeClass,
        themeClass,
        paddingClass,
        loading ? styles.loading : '',
        fullWidth ? styles.fullWidth : '',
        className,
      ]
        .filter(Boolean)
        .join(' ');

      // Handle keyboard events
      const handleKeyDown = (e) => {
        if (onKeyDown) {
          onKeyDown(e);
        }
        // Additional keyboard handling could go here if needed
      };

      // Handle click events
      const handleClick = (e) => {
        if (disabled || loading) {
          e.preventDefault();
          return;
        }
        if (onClick) {
          onClick(e);
        }
      };

      // For icon variant, ensure we have proper aria-label
      const needsAriaLabel = variant === 'icon';
      const finalAriaLabel = needsAriaLabel ? ariaLabel || 'Button' : ariaLabel;

      // Determine icon sizes based on button size and padding
      const getIconSize = () => {
        if (variant === 'icon' && padding === 'none') {
          // Scale icon to fill the button when no padding
          switch (size) {
            case 'xs':
              return 'sm'; // 12px icon in 24px button
            case 'sm':
              return 'md'; // 16px icon in 32px button
            case 'md':
              return 'lg'; // 20px icon in 40px button
            case 'lg':
              return 'xl'; // 24px icon in 48px button
            case 'xl':
              return '2xl'; // 32px icon in 56px button
            default:
              return 'lg';
          }
        }
        // Normal icon sizing for padded buttons
        return size === 'xs'
          ? 'xs'
          : size === 'sm'
            ? 'sm'
            : size === 'lg'
              ? 'lg'
              : size === 'xl'
                ? 'xl'
                : 'md';
      };

      const iconSize = getIconSize();

      return (
        <button
          ref={ref}
          type={type}
          className={buttonClasses}
          disabled={disabled || loading}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          aria-label={finalAriaLabel}
          aria-describedby={ariaDescribedBy}
          aria-disabled={disabled || loading}
          {...props}
        >
          {/* Left icon */}
          {leftIcon && !loading && (
            <Icon className={styles.leftIcon} size={iconSize} ariaHidden={true}>
              {leftIcon}
            </Icon>
          )}

          {/* Button text/children */}
          {variant === 'icon' ? (
            // For icon variant, render the icon as main content
            <Icon
              className={styles.iconContent}
              size={iconSize}
              ariaHidden={true}
            >
              {children}
            </Icon>
          ) : (
            // Regular text content
            children && <span className={styles.text}>{children}</span>
          )}

          {/* Right icon */}
          {rightIcon && !loading && (
            <Icon
              className={styles.rightIcon}
              size={iconSize}
              ariaHidden={true}
            >
              {rightIcon}
            </Icon>
          )}
        </button>
      );
    }
  )
);

Button.displayName = 'Button';

export default Button;
