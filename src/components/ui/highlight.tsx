
'use client';

import * as React from 'react';

type HighlightProps = {
  text: string | null | undefined;
  query: string;
};

export const Highlight: React.FC<HighlightProps> = ({ text, query }) => {
  if (!text) {
    return null; // Return null if text is not valid
  }

  if (!query) {
    return <span>{text}</span>;
  }

  const regex = new RegExp(`(${query})`, 'gi');
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <mark key={index} className="bg-primary/20 text-primary-foreground border border-primary/50 px-1 py-0.5 rounded-md">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
};
