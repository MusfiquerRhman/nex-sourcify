'use client';
import { useRouter } from "next/navigation";
import { plusIcon } from "~/assets";
import { Button, SearchField, Table, Wrapper, Popup } from "~/components";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { tableHeaders } from "./config/columns";
import { useSearchablePagination, useModulePermissions, useDeleteConfirmation } from "~/hooks";

const EarlySettlement = () => {
    const router = useRouter();
    const utils = api.useUtils();

    const { page, limit, debouncedSearch, handleSearchChange, nextPage, prevPage } = useSearchablePagination();

    const { can_add, can_update, can_delete } = useModulePermissions();

    // Fetch paginated data
    const {data: earlySettlements, isLoading} = api.earlySettlement.getEarlySettlements.useQuery({
        limit,
        offset: page * limit,
    });

    const buyerOrdersList = earlySettlements?.earlySettlements ?? [];
    const total = earlySettlements?.total ?? 0;
    
    // Search query (enabled only when there's a search term)
    const searchQuery = api.earlySettlement.searchEarlySettlements.useQuery(
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );

    const editURL = '/merchandising/early_settlement/edit/';

    const deleteMutation = api.earlySettlement.deleteEarlySettlement.useMutation({
        onSuccess: async () => {
            toast.success("Early Settlement deleted successfully!");
            await Promise.all([
                utils.earlySettlement.getEarlySettlements.invalidate(),
                utils.earlySettlement.searchEarlySettlements.invalidate(),
            ]);
        },
    });

    const { 
        deleteID, isLoadingDelete, deleteClicked, setDeleteClicked, handleDeleteClicked, handleDeleteConfirmed 
    } = useDeleteConfirmation({
        mutation: deleteMutation,
        successMessage: 'Early Settlement deleted successfully',
        payloadBuilder: id => ({ id }),
    });

    return (
        <>
            <Wrapper
                heading="Early Settlement"
                subSectionLeft={
                    <SearchField
                        placeholder="Search Early Settlement..."
                        infoText="Buyer Name, Order Reference, Style, PO, Department, Season, and Team name."
                        handleSearchChange={handleSearchChange}
                    />
                }
                subSectionRight={
                    can_add ? (
                        <div className="w-70">
                            <Button
                                variant="secondary"
                                label="Add Early Settlement"
                                leftIcon={plusIcon}
                                onClick={() => router.push('/merchandising/early_settlement/new')}
                            />
                        </div>
                    ) : null
                }
            >
                <div className="w-full">
                    <Table
                        data={searchQuery.data?.earlySettlements && !!debouncedSearch 
                            ? searchQuery.data.earlySettlements : buyerOrdersList
                        }
                        isLoading={isLoading || searchQuery.isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={searchQuery.data?.earlySettlements && searchQuery.data.earlySettlements.length > 0 
                            ? searchQuery.data.total ?? 0 : total
                        }
                        deleteFunction={handleDeleteClicked}
                        page={page}
                        limit={limit}
                        editURL={editURL}
                        allowDelete={can_delete}
                        allowEdit={can_update}
                        view={!can_update}
                    />
                </div>
            </Wrapper>
            <Popup
                open={deleteClicked}
                onClose={() => setDeleteClicked(false)}
                heading="Confirm Deletion"
                description={`Are you sure you want to delete Early Settlement of "${(
                    searchQuery.data?.earlySettlements && !!debouncedSearch 
                        ? searchQuery.data.earlySettlements : buyerOrdersList
                ).find(order => order.id === deleteID)?.ref_no}"?`}
                actionLabel="DELETE"
                negativeAction={true}
                loading={isLoadingDelete}
                action={handleDeleteConfirmed}
            />
        </>
    )
}

export default EarlySettlement;