'use client';
import { useRouter } from "next/navigation";
import { plusIcon } from "~/assets";
import { Button, SearchField, Table, Wrapper, Popup } from "~/components";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { tableHeaders } from "./config/columns";
import { useSearchablePagination, useModulePermissions, useDeleteConfirmation } from "~/hooks";
import { safeNumber } from "~/utils/numbers";

const BuyersPage = () => {
    const router = useRouter();
    const utils = api.useUtils();

    const { page, limit, debouncedSearch, handleSearchChange, nextPage, prevPage } = useSearchablePagination();

    const { can_add, can_update, can_delete } = useModulePermissions();

    // Fetch paginated data
    const {data: buyers, isLoading} = api.buyers.getBuyers.useQuery({
        limit,
        offset: page * limit,
    });

    const buyersList = buyers?.buyers ?? [];
    const total = buyers?.total ?? 0;

    // Search query (enabled only when there's a search term)
    const searchQuery = api.buyers.searchBuyers.useQuery(
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );

    const editURL = '/library/buyers/edit/';

    const deleteMutation = api.buyers.deleteBuyer.useMutation({
        onSuccess: async () => {
            toast.success("Buyer deleted successfully!");
            await Promise.all([
                utils.buyers.getBuyers.invalidate(),
                utils.buyers.searchBuyers.invalidate(),
            ]);
        },
    });

    const { 
        deleteID, isLoadingDelete, deleteClicked, setDeleteClicked, handleDeleteClicked, handleDeleteConfirmed 
    } = useDeleteConfirmation({
        mutation: deleteMutation,
        successMessage: 'Buyer deleted successfully',
        payloadBuilder: id => ({ id: safeNumber(id) }),
    });
    
    return (
        <>
            <Wrapper
                heading="Buyers"
                subSectionLeft={
                    <SearchField
                        placeholder="Search Buyers..."
                        infoText="Buyer Name, Short Name, Prefix, Email Address, Phone No, Address, Country, Overseas Offices, Contact person, website, Brand, Department and Sizes."
                        handleSearchChange={handleSearchChange}
                    />
                }
                subSectionRight={
                    can_add ? (
                        <div className="w-70">
                            <Button
                                variant="secondary"
                                label="Add New Buyer"
                                leftIcon={plusIcon}
                                onClick={() => router.push('/library/buyers/new')}
                            />
                        </div>
                    ) : null
                }
            >
                <div className="w-full">
                    <Table
                        data={searchQuery.data?.buyers && !!debouncedSearch 
                            ? searchQuery.data.buyers : buyersList
                        }
                        isLoading={isLoading || searchQuery.isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={searchQuery.data?.buyers && searchQuery.data.buyers.length > 0 
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
                description={`Are you sure you want to delete "${(
                    searchQuery.data?.buyers && !!debouncedSearch 
                        ? searchQuery.data.buyers : buyersList
                ).find(buyer => buyer.id === safeNumber(deleteID))?.buyer_name}"?`}
                actionLabel="DELETE"
                negativeAction={true}
                loading={isLoadingDelete}
                action={handleDeleteConfirmed}
            />
        </>
    );
};


export default BuyersPage;