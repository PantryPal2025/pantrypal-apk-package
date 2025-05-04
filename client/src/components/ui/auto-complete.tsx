import React, { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

interface AutoCompleteProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onItemSelect: (item: string) => void;
  endpoint: string;
  queryParam?: string;
  placeholder?: string;
  className?: string;
}

export function AutoComplete({
  onItemSelect,
  endpoint,
  queryParam = 'q',
  placeholder = 'Start typing...',
  className,
  ...props
}: AutoCompleteProps) {
  const [inputValue, setInputValue] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const suggestionsRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce function
  const debounce = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  // Fetch suggestions
  const fetchSuggestions = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest('GET', `${endpoint}?${queryParam}=${encodeURIComponent(query)}`);
      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced fetch
  const debouncedFetch = useRef(debounce(fetchSuggestions, 300)).current;

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    debouncedFetch(value);
    setShowSuggestions(true);
    setActiveIndex(-1);
  };

  // Handle suggestion selection
  const handleSelect = (suggestion: string) => {
    setInputValue(suggestion);
    onItemSelect(suggestion);
    setShowSuggestions(false);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    // Arrow Down
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } 
    // Arrow Up
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } 
    // Enter
    else if (e.key === 'Enter' && activeIndex > -1) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    }
    // Escape
    else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && suggestionsRef.current) {
      const activeItem = suggestionsRef.current.children[activeIndex] as HTMLElement;
      if (activeItem) {
        activeItem.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  }, [activeIndex]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current && 
        !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative w-full">
      <Input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => inputValue.length >= 2 && setShowSuggestions(true)}
        placeholder={placeholder}
        className={cn(className)}
        autoComplete="off"
        {...props}
      />

      {showSuggestions && suggestions.length > 0 && (
        <ul 
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 max-h-60 overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none text-sm"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              onClick={() => handleSelect(suggestion)}
              className={cn(
                'cursor-pointer select-none relative py-2 px-4 hover:bg-slate-100',
                activeIndex === index ? 'bg-slate-100' : ''
              )}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}

      {loading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      )}
    </div>
  );
}