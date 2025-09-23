
'use client';

import * as React from 'react';

type HighlightProps = {
  text: string;
  query: string;
};

export const Highlight = ({ text, query }: HighlightProps) => {
  if (!query) {
    return <span>{text}</span>;
  }

  const parts = text.split(new RegExp(`(${query})`, 'gi'));

  return (
    <span>
      {parts.map((part, index) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={index} className="bg-yellow-300 text-black p-0 m-0">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
};
