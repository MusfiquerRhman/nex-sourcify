'use client';
import { useRouter } from "next/navigation";
import { plusIcon } from "~/assets";
import { Button, SearchField, Table, Wrapper, Popup } from "~/components";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { tableHeaders } from "./config/columns";
import { useSearchablePagination, useModulePermissions, useDeleteConfirmation } from "~/hooks";


const SalesContracts = () => {
    const router = useRouter();
    const utils = api.useUtils();

    const { page, limit, debouncedSearch, handleSearchChange, nextPage, prevPage } = useSearchablePagination();

    const { can_add, can_update, can_delete } = useModulePermissions();

    // Fetch paginated data
    const {data: salesContracts, isLoading} = api.salesContracts.getSalesContracts.useQuery({
        limit,
        offset: page * limit,
    });

    const salesContractsList = salesContracts?.salesContracts ?? [];
    const total = salesContracts?.total ?? 0;

    // Search query (enabled only when there's a search term)
    const searchQuery = api.salesContracts.searchSalesContracts.useQuery(
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );

    // URLs for actions
    const editURL = '/merchandising/sales_contract/sales_contracts/edit/';
    const printURL = `/pdf/sales_contract/`;
    const printURL2 = `/pdf/sales_contract_commission/`;

    const deleteMutation = api.salesContracts.deleteSalesContract.useMutation({
        onSuccess: async () => {
            toast.success("Sales Contract deleted successfully!");
            await Promise.all([
                utils.salesContracts.getSalesContracts.invalidate(),
                utils.salesContracts.searchSalesContracts.invalidate(),
            ]);
        },
    });
    
    const { 
        deleteID, isLoadingDelete, deleteClicked, setDeleteClicked, handleDeleteClicked, handleDeleteConfirmed 
    } = useDeleteConfirmation({
        mutation: deleteMutation,
        successMessage: 'Sales Contract deleted successfully',
        payloadBuilder: id => ({ id }),
    });

    return (
        <>
            <Wrapper
                heading="Sales Contracts"
                subSectionLeft={
                    <SearchField
                        placeholder="Search Sales Contracts..."
                        infoText="Search Sales Contract No, Factory Name, Order Reference, Style or PO."
                        handleSearchChange={handleSearchChange}
                    />
                }
                subSectionRight={
                    can_add ? (
                        <div className="w-70">
                            <Button
                                variant="secondary"
                                label="Add New Sales Contract"
                                leftIcon={plusIcon}
                                onClick={() => router.push('/merchandising/sales_contract/sales_contracts/new')}
                            />
                        </div>
                    ) : null
                }
            >
                <div className="w-full">
                    <Table
                        data={searchQuery.data?.salesContracts && !!debouncedSearch 
                            ? searchQuery.data.salesContracts : salesContractsList
                        }
                        isLoading={isLoading || searchQuery.isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={searchQuery.data?.salesContracts && searchQuery.data.salesContracts.length > 0 
                            ? searchQuery.data.total ?? 0 : total
                        }
                        deleteFunction={handleDeleteClicked}
                        page={page}
                        limit={limit}
                        editURL={editURL}
                        allowDelete={can_delete}
                        allowEdit={can_update}
                        allowPrint={true}
                        printURL={printURL}
                        allowPrint2={true}
                        printURL2={printURL2}
                        view={!can_update}
                    />
                </div>
            </Wrapper>
            <Popup
                open={deleteClicked}
                onClose={() => setDeleteClicked(false)}
                heading="Confirm Deletion"
                description={`Are you sure you want to delete "${(
                    searchQuery.data?.salesContracts && !!debouncedSearch 
                        ? searchQuery.data.salesContracts : salesContractsList
                ).find(contract => contract.id === parseInt(deleteID))?.sales_contract_no}"?`}
                actionLabel="DELETE"
                negativeAction={true}
                loading={isLoadingDelete}
                action={handleDeleteConfirmed}
            />
        </>
    )
}

export default SalesContracts;