
'use client';

import * as React from 'react';

type HighlightProps = {
  text: string | null | undefined;
  query: string;
};

// Function to escape special characters for use in a regular expression
function escapeRegExp(string: string): string {
  // $& means the whole matched string
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}


export const Highlight: React.FC<HighlightProps> = ({ text, query }) => {
  if (!text) {
    return null; // Return null if text is not valid
  }

  if (!query) {
    return <span>{text}</span>;
  }

  const escapedQuery = escapeRegExp(query);
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <mark key={index} className="bg-orange-400/20 text-orange-800 dark:text-orange-300 border border-orange-500/50 px-1 py-0.5 rounded-md">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
};
