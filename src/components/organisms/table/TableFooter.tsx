import Button from "~/components/atoms/Button"
import { leftArrowIcon, rightArrowIcon } from "~/assets";
import clsx from "clsx";
import Image from "next/image";
import React from "react";

type TableFooterProps = {
    page: number;
    limit: number;
    total: number;
    prevPage: () => void;
    nextPage: () => void;
};

const TableFooter = ({ page, limit, total, prevPage, nextPage }: TableFooterProps) => {

    const isLastPage = (page + 1) * limit >= total;
    const isFirstPage = page === 0;

    const currentItem = page * limit + 1;
    const lastItem = Math.min((page + 1) * limit, total);

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="w-full flex justify-between gap-4 pt-1 pb-2 px-2">
            <p className="text-gray text-sm self-center lg:flex-3 md:flex-2 sm:flex-1">
                {totalPages > 0 && `Page ${page + 1} of ${totalPages}`}
            </p>
            <p className="text-gray text-sm self-center lg:flex-3 md:flex-2 sm:flex-1">
                {total !== undefined && currentItem !== undefined && lastItem !== undefined ? 
                    `Showing ${currentItem}-${lastItem} of ${total} rows` 
                    : null
                }
            </p>
            <div className="flex gap-8 justify-end flex-1">
                <button onClick={prevPage}
                    disabled={isFirstPage}
                    className={clsx('flex items-center gap-2 px-3 py-1 rounded', 
                        isFirstPage ? 'text-gray-400 cursor-not-allowed' : 'text-primary hover:text-secondary-60 hover:cursor-pointer'
                    )}
                >
                    <Image  width={20} height={20}src={leftArrowIcon.src} alt="Previous" className={`w-3 h-3 ${isFirstPage ? 'opacity-50' : ''}`} />
                    Previous
                </button>
                <button onClick={nextPage}
                    disabled={isLastPage}
                    className={clsx('flex items-center gap-3 px-3 py-1 rounded', 
                        isLastPage ? 'text-gray-400 cursor-not-allowed' : 'text-primary hover:text-secondary-60 hover:cursor-pointer'
                    )}
                >
                    Next
                    <Image width={20} height={20} src={rightArrowIcon.src} alt="Next" className={`w-3 h-3 ${isLastPage ? 'opacity-50' : ''}`} />
                </button>
            </div>
        </div>
    )
}

export default React.memo(TableFooter) as typeof TableFooter;