
'use client';

import * as React from 'react';

type HighlightProps = {
  text: string;
  query: string;
};

export const Highlight: React.FC<HighlightProps> = ({ text, query }) => {
  if (!query) {
    return <span>{text}</span>;
  }

  const regex = new RegExp(`(${query})`, 'gi');
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <mark key={index} className="bg-yellow-300 text-black p-0 m-0 rounded">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
};

    