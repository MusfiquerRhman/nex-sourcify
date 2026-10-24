'use client';

import { searchIcon } from "~/assets";
import Info from "../atoms/Info";
import { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { getStoredSearchQuery } from "~/utils/searchQueryStorage";

type SearchFieldProps = {
    handleSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    infoText?: string;
}

const SearchField = ({ handleSearchChange, placeholder, infoText }: SearchFieldProps) => {
    const pathname = usePathname();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchHistory, setSearchHistory] = useState<string[]>([]);
    const searchListId = `search-history-${pathname.replace(/[^a-zA-Z0-9_-]/g, '-')}`;

    useEffect(() => {
        setSearchTerm(getStoredSearchQuery(pathname));

        try {
            const storedHistory = window.localStorage.getItem(`search-history:${pathname}`);
            const parsedHistory: unknown = storedHistory ? JSON.parse(storedHistory) : [];

            setSearchHistory(
                Array.isArray(parsedHistory) && parsedHistory.every((item) => typeof item === 'string')
                    ? parsedHistory
                    : [],
            );
        } catch {
            setSearchHistory([]);
        }
    }, [pathname]);

    // Debounce search-history save
    useEffect(() => {
        const normalizedSearchTerm = searchTerm.trim();

        if (!normalizedSearchTerm) return;

        const timeout = window.setTimeout(() => {
            setSearchHistory((currentHistory) => {
                const nextHistory = [
                    normalizedSearchTerm,
                    ...currentHistory.filter((query) => query !== normalizedSearchTerm),
                ].slice(0, 10);

                window.localStorage.setItem(`search-history:${pathname}`, JSON.stringify(nextHistory));

                return nextHistory;
            });
        }, 500);

        return () => window.clearTimeout(timeout);
    }, [pathname, searchTerm]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
        handleSearchChange(event);
    };

    return (
        <div className="flex flex-col">
            <div className="flex flex-row items-center h-10 w-fit  emboss-inner rounded-full">
                <input placeholder={placeholder}
                    type='search'
                    id="search"
                    list={searchListId}
                    className="py-2 pl-4 w-100 focus:outline-none border-none"
                    value={searchTerm}
                    onChange={handleChange}
                />
                <datalist id={searchListId}>
                    {searchHistory.map((query) => (
                        <option key={query} value={query} />
                    ))}
                </datalist>
                <label htmlFor="search">
                    <Image width={20} height={20} src={searchIcon.src} alt="Search Icon" className="w-fit h-10 py-2 px-3 rounded-l-full" />
                </label>
            </div>
            <div className="min-h-8">
                {infoText &&
                    <Info info={infoText} variant="info" />
                }
            </div>
        </div>
    )
}

export default SearchField;