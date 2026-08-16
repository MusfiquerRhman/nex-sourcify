import { useEffect, useState } from "react";

// Don't DDoS your won API!
// Rate limit API calls, don't allow them to be made too frequently
const useDebouncedValue = (value: string, delay = 300) => {
    const [debouncedInput, setDebouncedInput] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedInput(value);
        }, delay); // 300ms debounce time

        return () => {
            clearTimeout(handler); // clear timeout if user keeps typing
        };
    }, [value, delay]);

    return debouncedInput;
};

export default useDebouncedValue;