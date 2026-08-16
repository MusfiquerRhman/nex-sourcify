'use client';
import { useRouter } from "next/navigation";
import { plusIcon } from "~/assets";
import { Button, SearchField, Table, Wrapper, Popup } from "~/components";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { tableHeaders } from "./config/columns";
import { useSearchablePagination, useModulePermissions, useDeleteConfirmation } from "~/hooks";
import { safeNumber } from "~/utils/numbers";

const BanksPage = () => {
    const router = useRouter();
    const utils = api.useUtils();

    const { page, limit, debouncedSearch, handleSearchChange, nextPage, prevPage } = useSearchablePagination();

    const { can_add, can_update, can_delete } = useModulePermissions();

    // Fetch paginated data
    const {data: banks, isLoading} = api.banks.getBanks.useQuery({
        limit,
        offset: page * limit,
    });

    const banksList = banks?.banks ?? [];
    const total = banks?.total ?? 0;

    // Search query (enabled only when there's a search term)
    const searchQuery = api.banks.searchBanks.useQuery(
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );

    const editURL = '/library/banks/edit/';

    const deleteMutation = api.banks.deleteBank.useMutation({
        onSuccess: async () => {
            toast.success("Bank deleted successfully!");
            await Promise.all([
                utils.banks.getBanks.invalidate(),
                utils.banks.searchBanks.invalidate()
            ]);
        },
    });

    const { 
        deleteID, isLoadingDelete, deleteClicked, setDeleteClicked, handleDeleteClicked, handleDeleteConfirmed 
    } = useDeleteConfirmation({
        mutation: deleteMutation,
        successMessage: 'Bank deleted successfully',
        payloadBuilder: id => ({ id: safeNumber(id) }),
    });

    return (
        <>
            <Wrapper heading="Banks"
                subSectionLeft={
                    <SearchField
                        placeholder="Search banks..."
                        infoText="Name, Country."
                        handleSearchChange={handleSearchChange}
                    />
                }
                subSectionRight={
                    can_add ? (
                        <div className="w-70">
                            <Button
                                variant="secondary"
                                label="Add New Bank"
                                leftIcon={plusIcon}
                                onClick={() => router.push('/library/banks/new')}
                            />
                        </div>
                    ) : null
                }
            >
                <div className="w-full">
                    <Table
                        data={searchQuery.data?.banks && !!debouncedSearch 
                            ? searchQuery.data.banks : banksList
                        }
                        isLoading={isLoading || searchQuery.isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={searchQuery.data?.banks && searchQuery.data.banks.length > 0 
                            ? searchQuery.data.total ?? 0 : total
                        }
                        deleteFunction={handleDeleteClicked}
                        page={page}
                        limit={limit}
                        editURL={can_update ? editURL : undefined}
                        allowDelete={can_delete}
                        allowEdit={can_update}
                    />
                </div>
            </Wrapper>
            <Popup
                open={deleteClicked}
                onClose={() => setDeleteClicked(false)}
                heading="Confirm Deletion"
                description={`Are you sure you want to delete "${(
                    searchQuery.data?.banks && !!debouncedSearch 
                        ? searchQuery.data.banks : banksList
                ).find(bank => bank.id === safeNumber(deleteID))?.name}"?`}
                actionLabel="DELETE"
                negativeAction={true}
                loading={isLoadingDelete}
                action={handleDeleteConfirmed}
            />
        </>
    );
};

export default BanksPage;
