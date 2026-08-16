'use client';

import { searchIcon } from "~/assets";
import Info from "../atoms/Info";
import { useState } from "react";
import Image from "next/image";

type SearchFieldProps = {
    handleSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    infoText?: string;
}

const SearchField = ({ handleSearchChange, placeholder, infoText }: SearchFieldProps) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <div className="flex flex-col">
            <div className="flex flex-row items-center h-10 w-fit  emboss-inner rounded-full">
                <input placeholder={placeholder}
                    type='search'
                    id="search"
                    className="py-2 pl-4 w-100 focus:outline-none border-none"
                    onChange={handleSearchChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                />
                <label htmlFor="search">
                    <Image width={20} height={20} src={searchIcon.src} alt="Search Icon" className="w-fit h-10 py-2 px-3 rounded-l-full" />
                </label>
            </div>
            <div className="min-h-8">
                {isFocused && infoText &&
                    <Info info={infoText} variant="info" />
                }
            </div>
        </div>
    )
}

export default SearchField;