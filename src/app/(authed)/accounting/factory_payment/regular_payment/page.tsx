'use client';
import { SearchField, Table, Wrapper } from "~/components";
import { api } from "~/trpc/react";
import { tableHeaders } from "./config/columns";
import { useSearchablePagination, useModulePermissions } from "~/hooks";

const FactoryPaymentPage = () => {
    const { page, limit, debouncedSearch, handleSearchChange, nextPage, prevPage } = useSearchablePagination();

    const { can_update } = useModulePermissions();

    const {data: factoryPayments, isLoading} = api.factoryPayment.getFactoryPayments.useQuery({
        limit,
        offset: page * limit,
    });

    const factoryPaymentList = factoryPayments?.factoryPayments ?? [];
    const total = factoryPayments?.total ?? 0;

    const searchQuery = api.factoryPayment.searchFactoryPayments.useQuery(
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );

    const editURL = '/accounting/factory_payment/regular_payment/edit/';

    return (
        <Wrapper
            heading="Regular Factory Payments"
            subSectionLeft={
                <SearchField
                    placeholder="Search Factory Payments..."
                    infoText="FDBC No, Buyer Name, Term and Factory Invoice."
                    handleSearchChange={handleSearchChange}
                />
            }
        >
            <div className="w-full">
                <Table
                    data={searchQuery.data?.factoryPayments && !!debouncedSearch 
                        ? searchQuery.data.factoryPayments : factoryPaymentList
                    }
                    isLoading={isLoading || searchQuery.isLoading}
                    columns={tableHeaders}
                    nextPage={nextPage}
                    prevPage={prevPage}
                    total={searchQuery.data?.factoryPayments && searchQuery.data.factoryPayments.length > 0 
                        ? searchQuery.data.total ?? 0 : total
                    }
                    page={page}
                    limit={limit}
                    editURL={editURL}
                    allowEdit={can_update}
                    view={!can_update}
                />
            </div>
        </Wrapper>
    )
}

export default FactoryPaymentPage;