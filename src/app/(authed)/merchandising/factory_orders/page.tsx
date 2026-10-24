'use client';
import { useRouter } from "next/navigation";
import { plusIcon } from "~/assets";
import { Button, SearchField, Table, Wrapper, Popup, Filter } from "~/components";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { tableHeaders } from "./config/columns";
import { useSearchablePagination, useModulePermissions, useDeleteConfirmation } from "~/hooks";
import { useState } from "react";

const FactoryOrders = () => {
    const router = useRouter();
    const utils = api.useUtils();
    const [filter, setFilter] = useState(-1);
    
    const { page, limit, debouncedSearch, handleSearchChange, nextPage, prevPage } = useSearchablePagination();

    const { can_add, can_update, can_delete } = useModulePermissions();

    // Fetch paginated data
    const {data: factoryOrders, isLoading} = api.factoryOrder.getFactoryOrders.useQuery({
        filter: filter,
        limit,
        offset: page * limit,
    });

    const factoryOrdersList = factoryOrders?.factoryOrders ?? [];
    const total = factoryOrders?.total ?? 0;

    // Search query (enabled only when there's a search term)
    const searchQuery = api.factoryOrder.searchFactoryOrders.useQuery(
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );

    const editURL = '/merchandising/factory_orders/edit/';

    const printURL = `/pdf/factory_order/`;

    const deleteMutation = api.factoryOrder.deleteFactoryOrder.useMutation({
        onSuccess: async () => {
            toast.success("Factory Order deleted successfully!");
            await Promise.all([
                utils.factoryOrder.getFactoryOrders.invalidate(),
                utils.factoryOrder.searchFactoryOrders.invalidate(),
                utils.factoryOrder.getBuyerOrderDetailsByFactoryOrderId.invalidate(),
            ]);
        },
    });

    const { 
        deleteID, isLoadingDelete, deleteClicked, setDeleteClicked, handleDeleteClicked, handleDeleteConfirmed 
    } = useDeleteConfirmation({
        mutation: deleteMutation,
        successMessage: 'Factory Order deleted successfully',
        payloadBuilder: id => ({ id }),
    });

    return (
        <>
            <Wrapper
                heading="Factory Orders"
                subSectionLeft={
                    <SearchField
                        placeholder="Search Factory Orders..."
                        infoText="Search Order Reference, Style, PO, Buyer Name, Factory Name, Department, Season"
                        handleSearchChange={handleSearchChange}
                    />
                }
                subSectionRight={
                    can_add ? (
                        <div className="w-70">
                            <Button
                                variant="secondary"
                                label="Add New Factory Order"
                                leftIcon={plusIcon}
                                onClick={() => router.push('/merchandising/factory_orders/new')}
                            />
                        </div>
                    ) : null
                }
                filters={
                    <Filter 
                        filter={filter}
                        setFilter={setFilter}
                        label='Approval Status'
                        options={[
                            {label: 'ALL', value: -1}, 
                            {label: 'APPROVED', value: 3},
                            {label: 'LEVEL 1 AUTHORIZED', value: 2}, 
                            {label: 'PENDING', value: 1}, 
                            {label: 'INCOMPLETE', value: 0}, 
                        ]}
                    />
                }
            >
                <div className="w-full">
                    <Table
                        data={searchQuery.data?.factoryOrders && !!debouncedSearch 
                            ? searchQuery.data.factoryOrders : factoryOrdersList
                        }
                        isLoading={isLoading || searchQuery.isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={searchQuery.data?.factoryOrders && searchQuery.data.factoryOrders.length > 0 
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
                        view={!can_update}
                    />
                </div>
            </Wrapper>
            <Popup
                open={deleteClicked}
                onClose={() => setDeleteClicked(false)}
                heading="Confirm Deletion"
                description={`Are you sure you want to delete "${(
                    searchQuery.data?.factoryOrders && !!debouncedSearch 
                        ? searchQuery.data.factoryOrders : factoryOrdersList
                ).find(order => order.id === deleteID)?.ref_no}"?`}
                actionLabel="DELETE"
                negativeAction={true}
                loading={isLoadingDelete}
                action={handleDeleteConfirmed}
            />
        </>
    )
}

export default FactoryOrders;

