import React, { useState } from 'react';
import { Search } from 'lucide-react';
import './SearchBar.css';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form className="search-bar glass" onSubmit={handleSubmit}>
      <Search size={20} className="search-icon" />
      <input
        type="text"
        placeholder="Yazılarda ara..."
        value={query}
        onChange={handleChange}
        className="search-input"
      />
    </form>
  );
}
