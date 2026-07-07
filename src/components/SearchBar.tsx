"use client";

import React, { useState } from "react";
import { Search, Sparkles } from "lucide-react";

interface SearchBarProps {
  onSearch: (companyName: string) => void;
  isLoading: boolean;
}

const SUGGESTIONS = ["Tesla", "Apple", "NVIDIA", "Microsoft", "Amazon"];

export function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query.trim());
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto mb-8">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Enter company name (e.g. Tesla, Apple, NVIDIA)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isLoading}
            className="w-full h-14 pl-12 pr-28 rounded-2xl border border-zinc-200 bg-white text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-md shadow-zinc-100/50 text-base"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
        </div>
        
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-5 rounded-xl bg-indigo-600 text-white font-medium text-sm flex items-center gap-1.5 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          <span>Research</span>
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-2 mt-4 pl-2">
        <span className="text-xs text-zinc-400 font-medium">Try searching:</span>
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => {
              setQuery(suggestion);
              onSearch(suggestion);
            }}
            disabled={isLoading}
            className="text-xs bg-white text-zinc-600 border border-zinc-200 hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-600 px-3.5 py-1.5 rounded-full font-semibold transition-all cursor-pointer shadow-sm hover:shadow-md hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
