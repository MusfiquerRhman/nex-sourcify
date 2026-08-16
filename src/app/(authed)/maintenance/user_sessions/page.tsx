'use client';
import { Wrapper, SearchField, Table } from "~/components";
import { api } from "~/trpc/react";
import { useSearchablePagination } from "~/hooks";
import { tableHeaders } from "./config/columns";

const ShipmentTolerancePage = () => {
    const { page, limit, debouncedSearch, handleSearchChange, nextPage, prevPage } = useSearchablePagination();
    
    // Fetch paginated data
    const {data: logs, isLoading} = api.userSessions.getSessions.useQuery({
        limit: 15,
        offset: page * limit,
    });

    const sessionList = logs?.sessions ?? [];
    const total = logs?.total ?? 0;

    // Search query (enabled only when there's a search term)
    const searchQuery = api.userSessions.searchSessions.useQuery(
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );

    return (
        <Wrapper
            heading="User Sessions"
            subSectionLeft={
                <SearchField
                    placeholder="Search User Sessions..."
                    infoText="User name, User ID, IP address, Browser, Device ID."
                    handleSearchChange={handleSearchChange}
                />
            }
        >
            <div className="w-full">
                <Table
                    data={searchQuery.data?.sessions && !!debouncedSearch 
                        ? searchQuery.data.sessions : sessionList
                    }
                    isLoading={isLoading || searchQuery.isLoading}
                    columns={tableHeaders}
                    nextPage={nextPage}
                    prevPage={prevPage}
                    total={searchQuery.data?.sessions && searchQuery.data.sessions.length > 0 
                        ? searchQuery.data.total ?? 0 : total
                    }
                    page={page}
                    limit={limit}
                    allowDelete={false}
                    allowEdit={false}
                    allowPrint={false}
                    view={false}
                />
            </div>
        </Wrapper>
    );
};
    
export default ShipmentTolerancePage;