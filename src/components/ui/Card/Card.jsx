// components/ui/Card/Card.jsx
import React, { memo, forwardRef } from 'react';
import styles from './Card.module.scss';

// Main Card component
const Card = memo(forwardRef(({ 
  variant = "default",      // 'default', 'elevated', 'listItem', 'linked'
  size = "default",         // 'compact', 'default', 'large'
  overflow = "visible",     // 'hidden', 'visible', 'auto', 'scroll'
  children,
  className = "",
  onClick,
  href,                     // For linked variant
  target,                   // For linked variant
  rel,                      // For linked variant
  ...props
}, ref) => {
  const variantClass = {
	default: styles.variantDefault,
	elevated: styles.variantElevated,
	listItem: styles.variantListItem,
	linked: styles.variantLinked
  }[variant];
  
  const sizeClass = {
	compact: styles.sizeCompact,
	default: '',
	large: styles.sizeLarge
  }[size];
  
  const cardClasses = [
	styles.card,
	variantClass,
	sizeClass,
	className
  ].filter(Boolean).join(' ');
  
  // Build inline styles for overflow
  const cardStyles = {
	overflow: overflow
  };
  
  // If it's a linked variant with href, render as anchor
  if (variant === 'linked' && href) {
	return (
	  <a
		ref={ref}
		href={href}
		target={target}
		rel={rel}
		className={`${cardClasses} ${styles.clickable}`}
		style={cardStyles}
		{...props}
	  >
		{children}
	  </a>
	);
  }
  
  // If it has onClick, make it a button-like div
  if (onClick) {
	return (
	  <div
		ref={ref}
		onClick={onClick}
		onKeyDown={(e) => {
		  if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onClick(e);
		  }
		}}
		tabIndex={0}
		role="button"
		className={cardClasses}
		style={cardStyles}
		{...props}
	  >
		{children}
	  </div>
	);
  }
  
  // Default: render as div
  return (
	<div
	  ref={ref}
	  className={cardClasses}
	  style={cardStyles}
	  {...props}
	>
	  {children}
	</div>
  );
}));

// Card sub-components
const CardHeader = memo(({ children, hasActions = false, className = "", ...props }) => {
  const headerClasses = [
	styles.header,
	hasActions ? styles.hasActions : '',
	className
  ].filter(Boolean).join(' ');
  
  return (
	<div className={headerClasses} {...props}>
	  {children}
	</div>
  );
});

const CardContent = memo(({ children, className = "", ...props }) => (
  <div className={`${styles.content} ${className}`} {...props}>
	{children}
  </div>
));

const CardActions = memo(({ children, position = "bottom", className = "", ...props }) => {
  const actionsClasses = [
	styles.actions,
	position === "header" ? styles.headerActions : '',
	className
  ].filter(Boolean).join(' ');
  
  return (
	<div className={actionsClasses} {...props}>
	  {children}
	</div>
  );
});

const CardFooter = memo(({ children, className = "", ...props }) => (
  <div className={`${styles.footer} ${className}`} {...props}>
	{children}
  </div>
));

const CardTitle = memo(({ children, className = "", ...props }) => (
  <h3 className={`${styles.title} ${className}`} {...props}>
	{children}
  </h3>
));

const CardSubtitle = memo(({ children, className = "", ...props }) => (
  <p className={`${styles.subtitle} ${className}`} {...props}>
	{children}
  </p>
));

const CardDescription = memo(({ children, className = "", ...props }) => (
  <p className={`${styles.description} ${className}`} {...props}>
	{children}
  </p>
));

// Set display names
Card.displayName = 'Card';
CardHeader.displayName = 'Card.Header';
CardContent.displayName = 'Card.Content';
CardActions.displayName = 'Card.Actions';
CardFooter.displayName = 'Card.Footer';
CardTitle.displayName = 'Card.Title';
CardSubtitle.displayName = 'Card.Subtitle';
CardDescription.displayName = 'Card.Description';

// Attach sub-components to main component
Card.Header = CardHeader;
Card.Content = CardContent;
Card.Actions = CardActions;
Card.Footer = CardFooter;
Card.Title = CardTitle;
Card.Subtitle = CardSubtitle;
Card.Description = CardDescription;

export default Card;