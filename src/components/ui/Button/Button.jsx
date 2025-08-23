// Temporary test in Button.jsx
import React, { memo, forwardRef } from 'react';
import Icon from '../Icon';
import styles from './Button.module.scss';

const Button = ({ children, ...props }) => {
  return <button {...props}>{children}</button>;
};

export default Button;
