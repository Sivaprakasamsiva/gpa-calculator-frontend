import React, { useState, useMemo, useRef, useEffect } from "react";

const SearchableElectiveSelect = ({
  value,
  options,
  onChange,
  placeholder = "(leave unselected)"
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  // close dropdown when clicked outside
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return options.filter(
      (o) =>
        o.code.toLowerCase().includes(s) ||
        o.name.toLowerCase().includes(s)
    );
  }, [search, options]);

  const selectedObj = options.find((o) => o.id === Number(value));

  return (
    <div className="relative w-full" ref={ref}>
      {/* main input */}
      <div
        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm cursor-pointer"
        onClick={() => setOpen((p) => !p)}
      >
        {selectedObj
          ? `${selectedObj.code} - ${selectedObj.name}`
          : <span className="text-gray-400">{placeholder}</span>}
      </div>

      {/* dropdown */}
      {open && (
        <div className="absolute z-50 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md mt-1 shadow-lg max-h-60 overflow-y-auto">

          {/* search box */}
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subject..."
            className="w-full px-3 py-2 border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          />

          {/* list */}
          <div className="max-h-48 overflow-y-auto">
            <div
              className="px-3 py-2 text-sm text-gray-500 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
              onClick={() => {
                onChange(""); // clear selection
                setOpen(false);
              }}
            >
              (leave unselected)
            </div>

            {filtered.map((opt) => (
              <div
                key={opt.id}
                onClick={() => {
                  onChange(opt.id);
                  setOpen(false);
                }}
                className="px-3 py-2 text-sm text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                {opt.code} - {opt.name}
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                No results found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableElectiveSelect;
