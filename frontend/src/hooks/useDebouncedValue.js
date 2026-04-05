import { useEffect, useState } from 'react';

export default function useDebouncedValue(value, delay = 200) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebounced(value);
    }, delay);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [value, delay]);

  return debounced;
}
