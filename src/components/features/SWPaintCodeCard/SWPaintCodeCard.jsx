// components/features/SWPaintCodeCard/SWPaintCodeCard.jsx
import React, { memo } from 'react';
import Card from '../../ui/Card';
import { getPaintByCode } from '../../../data/PaintData-SherwinWilliams';
import styles from './SWPaintCodeCard.module.scss';

const SWPaintCodeCard = memo(
  ({
    label,
    paintCode, // Now expects just the paint code (e.g. 'SW 6082')
    type = 'Exterior', // Paint type (from color scheme)
    finish = 'Satin', // Paint finish (from color scheme)
    className = '',
    ...props
  }) => {
    // Get paint info from database
    const paintInfo = getPaintByCode(paintCode);

    if (!paintInfo) {
      return null;
    }

    // Extract SW number from code (e.g. "SW 6082" -> "6082")
    const swNumber = paintInfo.code.replace('SW ', '');
    const sherwinWilliamsUrl = `https://www.sherwin-williams.com/homeowners/color/find-and-explore-colors/paint-colors-by-family/SW${swNumber}`;

    return (
      <Card
        variant="linked"
        href={sherwinWilliamsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        {...props}
      >
        <Card.Header>
          <Card.Title className={styles.paintCardTitle}>{label}</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className={styles.paintCardContent}>
            <div
              className={styles.colorSwatch}
              style={{ backgroundColor: paintInfo.hex }}
              aria-label={`${paintInfo.name} color swatch`}
            />
            <div className={styles.paintInfo}>
              <p className={styles.paintCode}>{paintInfo.code}</p>
              <p className={styles.paintName}>{paintInfo.name}</p>
              <p className={styles.paintSpecs}>
                {type} {finish}
              </p>
            </div>
          </div>
        </Card.Content>
      </Card>
    );
  }
);

SWPaintCodeCard.displayName = 'SWPaintCodeCard';

export default SWPaintCodeCard;
