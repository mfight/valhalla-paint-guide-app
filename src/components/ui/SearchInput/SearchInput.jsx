// components/ui/SearchInput/SearchInput.jsx
import React, { memo, forwardRef } from 'react';
import { Search, X } from 'lucide-react';
import Icon from '../Icon';
import Button from '../Button';
import styles from './SearchInput.module.scss';

const SearchInput = memo(
  forwardRef(
    (
      {
        value = '',
        onChange,
        onClear,
        placeholder = 'Search...',
        size = 'md', // 'sm', 'md', 'lg'
        className = '',
        disabled = false,
        autoComplete = 'off',
        autoFocus = false,
        ariaLabel,
        id,
        name,
        ...props
      },
      ref
    ) => {
      const handleClear = () => {
        if (onClear) {
          onClear();
        }
      };

      const sizeClass = {
        sm: styles.sizeSmall,
        md: '',
        lg: styles.sizeLarge,
      }[size];

      // Determine button size based on input size
      const buttonSize = size === 'sm' ? 'xs' : size === 'lg' ? 'md' : 'sm';

      return (
        <div className={`${styles.container} ${sizeClass} ${className}`}>
          <Icon
            className={styles.searchIcon}
            color="muted"
            size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'sm'}
            ariaHidden={true}
          >
            <Search />
          </Icon>

          <input
            ref={ref}
            type="text"
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            autoComplete={autoComplete}
            autoFocus={autoFocus}
            aria-label={ariaLabel || placeholder}
            id={id}
            name={name}
            className={styles.input}
            {...props}
          />

          {value && !disabled && (
            <Button
              variant="icon"
              size={buttonSize}
              padding="none"
              onClick={handleClear}
              className={styles.clearButton}
              aria-label="Clear search"
              type="button"
            >
              <X />
            </Button>
          )}
        </div>
      );
    }
  )
);

SearchInput.displayName = 'SearchInput';

export default SearchInput;
