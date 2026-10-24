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
        <div className="nex-table-footer flex w-full flex-wrap items-center justify-between gap-4 px-4 py-4">
            <p className="text-gray text-sm self-center lg:flex-3 md:flex-2 sm:flex-1">
                {totalPages > 0 && `Page ${page + 1} of ${totalPages}`}
            </p>
            <p className="text-gray text-sm self-center lg:flex-3 md:flex-2 sm:flex-1">
                {total !== undefined && currentItem !== undefined && lastItem !== undefined ? 
                    `Showing ${currentItem}-${lastItem} of ${total} rows` 
                    : null
                }
            </p>
            <div className="flex flex-1 justify-end gap-2">
                <button onClick={prevPage}
                    disabled={isFirstPage}
                    className={clsx('nex-table-page flex items-center gap-2 px-3 py-2', 
                        isFirstPage ? 'text-gray-400 cursor-not-allowed' : 'text-primary hover:text-secondary-60 hover:cursor-pointer'
                    )}
                >
                    <Image  width={20} height={20}src={leftArrowIcon.src} alt="Previous" className={`w-3 h-3 ${isFirstPage ? 'opacity-50' : ''}`} />
                    Previous
                </button>
                <button onClick={nextPage}
                    disabled={isLastPage}
                    className={clsx('nex-table-page flex items-center gap-3 px-3 py-2', 
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