// components/ui/Icon/Icon.jsx
import React, { memo, forwardRef } from 'react';
import styles from './Icon.module.scss';

const Icon = memo(forwardRef(({ 
  children,                    // Lucide icon component
  icon: IconComponent,         // Alternative way to pass icon
  size = "md",                 // '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'
  color = "default",           // 'default', 'primary', 'secondary', 'success', 'warning', 'error', 'muted', 'inverse' OR hex/css color
  lightColor,                  // Override light mode color
  darkColor,                   // Override dark mode color
  className = "",
  onClick,
  disabled = false,
  animation,                   // 'spin', 'pulse'
  ariaLabel,
  ariaHidden = true,          // Icons are decorative by default
  style = {},
  ...props
}, ref) => {
  
  const sizeClass = {
	'2xs': styles.size2xs,
	'xs': styles.sizexs,
	'sm': styles.sizesm,
	'md': styles.sizemd,
	'lg': styles.sizelg,
	'xl': styles.sizexl,
	'2xl': styles.size2xl,
	'3xl': styles.size3xl
  }[size];
  
  // Check if color is a preset or a custom color
  const isPresetColor = [
	'default', 'primary', 'secondary', 'success', 
	'warning', 'error', 'muted', 'inverse'
  ].includes(color);
  
  const colorClass = isPresetColor ? {
	default: styles.colorDefault,
	primary: styles.colorPrimary,
	secondary: styles.colorSecondary,
	success: styles.colorSuccess,
	warning: styles.colorWarning,
	error: styles.colorError,
	muted: styles.colorMuted,
	inverse: styles.colorInverse
  }[color] : '';
  
  const animationClass = animation ? {
	spin: styles.spin,
	pulse: styles.pulse
  }[animation] : '';
  
  const iconClasses = [
	styles.icon,
	sizeClass,
	colorClass,
	animationClass,
	onClick && !disabled ? styles.interactive : '',
	disabled ? styles.disabled : '',
	className
  ].filter(Boolean).join(' ');
  
  // Build custom styles for color overrides
  const customStyles = {
	...style
  };
  
  // Handle custom colors and overrides
  if (!isPresetColor) {
	// Direct color value (hex, rgb, css variable, etc.)
	customStyles.color = color;
  } else if (lightColor || darkColor) {
	// CSS custom properties for light/dark mode overrides
	if (lightColor) {
	  customStyles['--icon-light-override'] = lightColor;
	}
	if (darkColor) {
	  customStyles['--icon-dark-override'] = darkColor;
	}
  }
  
  const handleClick = (e) => {
	if (disabled || !onClick) return;
	onClick(e);
  };
  
  const handleKeyDown = (e) => {
	if (disabled || !onClick) return;
	
	if (e.key === 'Enter' || e.key === ' ') {
	  e.preventDefault();
	  onClick(e);
	}
  };
  
  // Get the actual icon to render
  const iconToRender = IconComponent || children;
  
  // If it's clickable, make it focusable
  const tabIndex = onClick && !disabled ? 0 : -1;
  
  return (
	<span
	  ref={ref}
	  className={iconClasses}
	  style={customStyles}
	  onClick={handleClick}
	  onKeyDown={handleKeyDown}
	  tabIndex={tabIndex}
	  role={onClick ? "button" : undefined}
	  aria-label={ariaLabel}
	  aria-hidden={ariaHidden}
	  aria-disabled={disabled}
	  {...props}
	>
	  {iconToRender}
	</span>
  );
}));

Icon.displayName = 'Icon';

export default Icon;