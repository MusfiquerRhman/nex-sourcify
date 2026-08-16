'use client';
import { SearchField, Table, Wrapper } from "~/components";
import { api } from "~/trpc/react";
import { tableHeaders } from "./config/columns";
import { useSearchablePagination, useModulePermissions } from "~/hooks";

const TnaInvoiceClubbingPage = () => {
    const { page, limit, debouncedSearch, handleSearchChange, nextPage, prevPage } = useSearchablePagination();

    const { can_update } = useModulePermissions();

    const {data: tnaPlans, isLoading} = api.commercialTnaPlan.getTnaPlanning.useQuery({
        limit,
        offset: page * limit,
    });

    const tnaPlanList = tnaPlans?.tnaPlans ?? [];
    const total = tnaPlans?.total ?? 0;

    // Search query (enabled only when there's a search term)
    const searchQuery = api.commercialTnaPlan.searchTNAPlans.useQuery(
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );

    const editURL = '/commercial/tna/tna_planning/edit/';

    return (
        <>
            <Wrapper
                heading="Commercial TNA Plans"
                subSectionLeft={
                    <SearchField
                        placeholder="Search TNA Plans..."
                        infoText="Factory Invoice, Tna Template, Factory name, Buyer Name."
                        handleSearchChange={handleSearchChange}
                    />
                }
            >
                <div className="w-full">
                    <Table
                        data={searchQuery.data?.tnaPlans && !!debouncedSearch 
                            ? searchQuery.data.tnaPlans : tnaPlanList
                        }
                        isLoading={isLoading || searchQuery.isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={searchQuery.data?.tnaPlans && searchQuery.data.tnaPlans.length > 0 
                            ? searchQuery.data.total ?? 0 : total
                        }
                        page={page}
                        limit={limit}
                        editURL={editURL}
                        allowDelete={false}
                        allowEdit={can_update}
                        allowPrint={false}
                        view={!can_update}
                    />
                </div>
            </Wrapper>
        </>
    )
}

export default TnaInvoiceClubbingPage;