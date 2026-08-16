'use client';
import { useRouter } from "next/navigation";
import { plusIcon } from "~/assets";
import { Button, SearchField, Table, Wrapper, Popup } from "~/components";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { tableHeaders } from "./config/columns";
import { useSearchablePagination, useModulePermissions, useDeleteConfirmation } from "~/hooks";

const ProceedRealizationPage = () => {
    const router = useRouter();
    const utils = api.useUtils();

    const { page, limit, debouncedSearch, handleSearchChange, nextPage, prevPage } = useSearchablePagination();

    const { can_add, can_update, can_delete } = useModulePermissions();

    const {data: proceedRealizations, isLoading} = api.proceedRealization.getProceedRealization.useQuery({
        limit,
        offset: page * limit,
    });

    const proceedRealizationList = proceedRealizations?.proceedRealizations ?? [];
    const total = proceedRealizations?.total ?? 0;

    const searchQuery = api.proceedRealization.searchProceedRealization.useQuery(
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );

    const editURL = '/accounting/proceed_realization/edit/';

    const deleteMutation = api.proceedRealization.deleteProceedRealization.useMutation({
        onSuccess: async () => {
            toast.success("Proceed Realization deleted successfully!");
            await Promise.all([
                utils.proceedRealization.getProceedRealization.invalidate(),
                utils.proceedRealization.searchProceedRealization.invalidate(),
            ]);
        }
    });

    // Handlers
    const { 
        deleteID, isLoadingDelete, deleteClicked, setDeleteClicked, handleDeleteClicked, handleDeleteConfirmed 
    } = useDeleteConfirmation({
        mutation: deleteMutation,
        successMessage: 'Proceed Realization deleted successfully',
        payloadBuilder: id => ({ id }),
    });
        
    return (
        <>
            <Wrapper
                heading="Proceed Realizations"
                subSectionLeft={
                    <SearchField
                        placeholder="Search Proceed Realizations..."
                        infoText="FDBC No, Buyer Name, Term and Invoice."
                        handleSearchChange={handleSearchChange}
                    />
                }
                subSectionRight={
                    can_add ? (
                        <div className="w-70">
                            <Button
                                variant="secondary"
                                label="Add New Proceed Realization"
                                leftIcon={plusIcon}
                                onClick={() => router.push('/accounting/proceed_realization/new')}
                            />
                        </div>
                    ) : null
                }
            >
                <div className="w-full">
                    <Table
                        data={searchQuery.data?.proceedRealizations && !!debouncedSearch 
                            ? searchQuery.data.proceedRealizations : proceedRealizationList
                        }
                        isLoading={isLoading || searchQuery.isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={searchQuery.data?.proceedRealizations && searchQuery.data.proceedRealizations.length > 0 
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
                    searchQuery.data?.proceedRealizations && !!debouncedSearch 
                        ? searchQuery.data.proceedRealizations : proceedRealizationList
                ).find((proceedRealization) => proceedRealization.id === deleteID)?.fdbc_no}"?`}
                actionLabel="DELETE"
                negativeAction={true}
                loading={isLoadingDelete}
                action={handleDeleteConfirmed}
            />
        </>
    )
}

export default ProceedRealizationPage;