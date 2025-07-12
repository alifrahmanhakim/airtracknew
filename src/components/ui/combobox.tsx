
'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';

export type ComboboxOption = {
  value: string;
  label: string;
};

interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  className,
}: ComboboxProps) {
  const dataListId = React.useId();

  return (
    <>
      <Input
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
        list={dataListId}
        autoComplete="off"
      />
      <datalist id={dataListId}>
        {options.map((option) => (
          <option key={option.value} value={option.value} />
        ))}
      </datalist>
    </>
  );
}
