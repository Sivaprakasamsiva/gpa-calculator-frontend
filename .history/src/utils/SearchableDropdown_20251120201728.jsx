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

  // Close when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = options.filter(
    (o) =>
      o.code.toLowerCase().includes(search.toLowerCase()) ||
      o.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={ref} className="relative w-full text-sm">
      {/* Input box */}
      <div
        onClick={() => setOpen(true)}
        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 cursor-pointer"
      >
        {value
          ? options.find((o) => o.id === Number(value))?.code +
            " - " +
            options.find((o) => o.id === Number(value))?.name
          : placeholder}
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md max-h-64 overflow-y-auto shadow-lg">
          {/* Search Box */}
          <input
            autoFocus
            placeholder="Search subjects..."
            className="w-full px-3 py-2 border-b border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* (leave unselected) */}
          <div
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-gray-700 dark:text-gray-200"
          >
            (leave unselected)
          </div>

          {/* Options */}
          {filtered.map((opt) => (
            <div
              key={opt.id}
              onClick={() => {
                onChange(String(opt.id));
                setOpen(false);
              }}
              className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-gray-900 dark:text-gray-100"
            >
              {opt.code} - {opt.name}
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="px-3 py-2 text-gray-500 dark:text-gray-400">
              No results
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown;
