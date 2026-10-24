const SEARCH_QUERY_PREFIX = "search-query:";
const SEARCH_QUERY_TTL_MS = 30 * 60 * 1000;

type StoredSearchQuery = {
    value: string;
    savedAt: number;
};

const getSearchQueryKey = (pathname: string) => `${SEARCH_QUERY_PREFIX}${pathname}`;

// Each Search Query has a `SEARCH_QUERY_TTL_MS` of TTL period
// when it is automatically shown in the searchbar, unless the user clears it manually
export const getStoredSearchQuery = (pathname: string) => {
    const key = getSearchQueryKey(pathname);
    const storedValue = window.localStorage.getItem(key);

    if (!storedValue) return '';

    try {
        const parsedValue: unknown = JSON.parse(storedValue);

        if (
            typeof parsedValue !== 'object' ||
            parsedValue === null ||
            !('value' in parsedValue) ||
            !('savedAt' in parsedValue) ||
            typeof parsedValue.value !== 'string' ||
            typeof parsedValue.savedAt !== 'number'
        ) {
            window.localStorage.removeItem(key);
            return '';
        }

        if (Date.now() - parsedValue.savedAt >= SEARCH_QUERY_TTL_MS) {
            window.localStorage.removeItem(key);
            return '';
        }

        return parsedValue.value;
    } catch {
        window.localStorage.removeItem(key);
        return '';
    }
};

export const setStoredSearchQuery = (pathname: string, value: string) => {
    const storedValue: StoredSearchQuery = {
        value,
        savedAt: Date.now(),
    };

    window.localStorage.setItem(getSearchQueryKey(pathname), JSON.stringify(storedValue));
};

export const removeStoredSearchQuery = (pathname: string) => {
    window.localStorage.removeItem(getSearchQueryKey(pathname));
};
