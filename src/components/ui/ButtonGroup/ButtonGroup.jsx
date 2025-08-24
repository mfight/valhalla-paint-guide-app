// components/ui/ButtonGroup/ButtonGroup.jsx
import React, { memo } from 'react';
import styles from './ButtonGroup.module.scss';

const ButtonGroup = memo(
  ({
    sections = [],
    orientation = 'horizontal', // 'horizontal', 'vertical'
    spacing = 'sm', // 'none', 'xs', 'sm', 'md', 'lg' - spacing within sections
    sectionJustify = 'space-between', // 'space-between', 'flex-start', 'flex-end', 'center', 'space-around'
    fullWidth = false,
    responsiveReverse = false, // Reverse section order on mobile
    className = '',
    ...props
  }) => {
    const orientationClass = {
      horizontal: styles.horizontal,
      vertical: styles.vertical,
    }[orientation];

    const spacingClass = {
      none: styles.spacingNone,
      xs: styles.spacingXs,
      sm: styles.spacingSm,
      md: styles.spacingMd,
      lg: styles.spacingLg,
    }[spacing];

    const justifyClass = {
      'space-between': styles.justifySpaceBetween,
      'flex-start': styles.justifyStart,
      'flex-end': styles.justifyEnd,
      center: styles.justifyCenter,
      'space-around': styles.justifySpaceAround,
    }[sectionJustify];

    const containerClasses = [
      styles.buttonGroup,
      orientationClass,
      justifyClass,
      fullWidth ? styles.fullWidth : '',
      responsiveReverse ? styles.responsiveReverse : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    // If no sections provided, return null
    if (!sections.length) {
      return null;
    }

    return (
      <div className={containerClasses} {...props}>
        {sections.map((section, sectionIndex) => {
          // Skip empty sections
          if (!section || !section.length) {
            return null;
          }

          return (
            <div
              key={sectionIndex}
              className={`${styles.section} ${spacingClass}`}
            >
              {section.map((button, buttonIndex) => {
                // Clone the button to add any additional props if needed
                return React.cloneElement(button, {
                  key: button.key || buttonIndex,
                  ...button.props,
                });
              })}
            </div>
          );
        })}
      </div>
    );
  }
);

ButtonGroup.displayName = 'ButtonGroup';

export default ButtonGroup;
