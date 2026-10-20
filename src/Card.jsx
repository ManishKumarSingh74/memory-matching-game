import React from 'react';

function Card({ card, index, onClick }) {
  const { symbol, faceUp, matched } = card;

  let className = 'card';
  if (matched) className += ' card--matched';
  else if (faceUp) className += ' card--faceup';

  const ariaLabel = faceUp || matched
    ? `Card ${index + 1}, ${symbol}`
    : `Card ${index + 1}, face down`;

  return (
    <button
      className={className}
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={matched}
    >
      <span className="card__face">
        {faceUp || matched ? symbol : '?'}
      </span>
    </button>
  );
}

export default Card;
