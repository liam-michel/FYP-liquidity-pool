import { useState, useEffect, useRef, useMemo } from "react";
import debounce from "lodash.debounce";
export default function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useDebounceFunc(callback, t) {
  const ref = useRef(callback)

  useEffect(() => {
    ref.current = callback
  }, [callback]);

  const debouncedFunc = useMemo(() => {
    const func = (...args) => {
      return ref.current(args)
    }

    return debounce(func, t)
  }, [])

  return debouncedFunc;
}