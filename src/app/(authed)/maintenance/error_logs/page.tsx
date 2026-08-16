'use client';
import { Wrapper, TableFooter, SearchField } from "~/components";
import { api } from "~/trpc/react";
import { useSearchablePagination } from "~/hooks";
import ErrorLogs from "./_components/errorLog";

const ShipmentTolerancePage = () => {
    const { page, limit, debouncedSearch, handleSearchChange, nextPage, prevPage } = useSearchablePagination();
    
    // Fetch paginated data
    const {data: logs} = api.errorLogs.getErrors.useQuery({
        limit: 10,
        offset: page * limit,
    });

    const errorList = logs?.errors ?? [];
    const total = logs?.total ?? 0;

    // Search query (enabled only when there's a search term)
    const searchQuery = api.errorLogs.searchErrors.useQuery(
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );

    return (
        <Wrapper
            heading="Error Logs"
            subSectionLeft={
                <SearchField
                    placeholder="Search Error Logs..."
                    infoText="User name, Procedure, request method, IP address, User Agent, Referer, Error Name, Code, Message."
                    handleSearchChange={handleSearchChange}
                />
            }
        >
            <div className="w-full">
                <ErrorLogs errorList={searchQuery.data?.errors || errorList} />
                <TableFooter 
                    page={page}
                    limit={10}
                    total={searchQuery.data?.errors && searchQuery.data.errors.length > 0 
                        ? searchQuery.data.total ?? 0 : total
                    }
                    prevPage={prevPage}
                    nextPage={nextPage}
                />
            </div>
        </Wrapper>
    );
};
    
export default ShipmentTolerancePage;