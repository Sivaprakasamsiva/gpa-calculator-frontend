// src/components/SearchableDropdown.jsx
import React, { useState, useEffect, useRef } from "react";

const SearchableDropdown = ({
  value,
  options,
  onChange,
  placeholder = "(leave unselected)",
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = options.filter((o) => {
    const s = search.toLowerCase();
    return (
      o.code.toLowerCase().includes(s) ||
      o.name.toLowerCase().includes(s)
    );
  });

  const selectedObj = options.find((o) => o.id === Number(value));

  return (
    <div className="relative w-full text-sm" ref={ref}>
      <div
        onClick={() => setOpen(!open)}
        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 cursor-pointer"
      >
        {selectedObj
          ? `${selectedObj.code} - ${selectedObj.name}`
          : <span className="text-gray-400">{placeholder}</span>}
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-64 overflow-y-auto">

          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="Search..."
          />

          <div
            className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
          >
            (leave unselected)
          </div>

          {filtered.map((opt) => (
            <div
              key={opt.id}
              className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100"
              onClick={() => {
                onChange(String(opt.id));
                setOpen(false);
              }}
            >
              {opt.code} - {opt.name}
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="px-3 py-2 text-gray-500 dark:text-gray-400">
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown;
