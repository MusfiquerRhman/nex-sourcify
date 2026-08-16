'use client';
import { useRouter } from "next/navigation";
import { plusIcon } from "~/assets";
import { Button, SearchField, Table, Wrapper, Popup } from "~/components";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { tableHeaders } from "./config/columns";
import { useSearchablePagination, useModulePermissions, useDeleteConfirmation } from "~/hooks";

const BuyerOrders = () => {
    const router = useRouter();
    const utils = api.useUtils();

    const { page, limit, debouncedSearch, handleSearchChange, nextPage, prevPage } = useSearchablePagination();

    const { can_add, can_update, can_delete } = useModulePermissions();

    // Fetch paginated data
    const {data: buyerOrders, isLoading} = api.buyerOrders.getBuyerOrders.useQuery({
        limit,
        offset: page * limit,
    });

    const buyerOrdersList = buyerOrders?.buyerOrders ?? [];
    const total = buyerOrders?.total ?? 0;
    
    // Search query (enabled only when there's a search term)
    const searchQuery = api.buyerOrders.searchBuyerOrders.useQuery(
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );

    const editURL = '/merchandising/buyer_orders/edit/';
    const printURL = `/pdf/buyer_order/`;

    const deleteMutation = api.buyerOrders.deleteBuyerOrder.useMutation({
        onSuccess: async () => {
            toast.success("Buyer Order deleted successfully!");
            await Promise.all([
                utils.buyerOrders.getBuyerOrders.invalidate(),
                utils.buyerOrders.searchBuyerOrders.invalidate(),
            ]);
        },
    });

    const { 
        deleteID, isLoadingDelete, deleteClicked, setDeleteClicked, handleDeleteClicked, handleDeleteConfirmed 
    } = useDeleteConfirmation({
        mutation: deleteMutation,
        successMessage: 'Buyer Order deleted successfully',
        payloadBuilder: id => ({ id }),
    });

    return (
        <>
            <Wrapper
                heading="Buyer Orders"
                subSectionLeft={
                    <SearchField
                        placeholder="Search Buyer Orders..."
                        infoText="Buyer Name, Order Reference, Style, PO, Department, Season, and Team name."
                        handleSearchChange={handleSearchChange}
                    />
                }
                subSectionRight={
                    can_add ? (
                        <div className="w-70">
                            <Button
                                variant="secondary"
                                label="Add New Buyer Order"
                                leftIcon={plusIcon}
                                onClick={() => router.push('/merchandising/buyer_orders/new')}
                            />
                        </div>
                    ) : null
                }
            >
                <div className="w-full">
                    <Table
                        data={searchQuery.data?.buyerOrders && !!debouncedSearch 
                            ? searchQuery.data.buyerOrders : buyerOrdersList
                        }
                        isLoading={isLoading || searchQuery.isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={searchQuery.data?.buyerOrders && searchQuery.data.buyerOrders.length > 0 
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
                    searchQuery.data?.buyerOrders && !!debouncedSearch 
                        ? searchQuery.data.buyerOrders : buyerOrdersList
                ).find(order => order.id === deleteID)?.ref_no}"?`}
                actionLabel="DELETE"
                negativeAction={true}
                loading={isLoadingDelete}
                action={handleDeleteConfirmed}
            />
        </>
    )
}

export default BuyerOrders;