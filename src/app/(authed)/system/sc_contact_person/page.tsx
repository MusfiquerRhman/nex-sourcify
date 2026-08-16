'use client';
import { useRouter } from "next/navigation";
import { plusIcon } from "~/assets";
import { Button, SearchField, Table, Wrapper, Popup } from "~/components";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { tableHeaders } from "./config/columns";
import { useSearchablePagination, useModulePermissions, useDeleteConfirmation } from "~/hooks";
import { safeNumber } from "~/utils/numbers";

const ScContactPersonPage = () => {
    const router = useRouter();
    const utils = api.useUtils();
    
    const { page, limit, debouncedSearch, handleSearchChange, nextPage, prevPage } = useSearchablePagination();
    
    const { can_add, can_update, can_delete } = useModulePermissions();

    // Fetch paginated data
    const {data: contactPersons, isLoading} = api.scContactPerson.getContactPersons.useQuery({
        limit,
        offset: page * limit,
    });

    const contactPersonsList = contactPersons?.contactPersons ?? [];
    const total = contactPersons?.total ?? 0;

    // Search query (enabled only when there's a search term)
    const searchQuery = api.scContactPerson.searchContactPersons.useQuery(
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );

    const editURL = '/maintenance/sc_contact_person/edit/';

    const deleteMutation = api.scContactPerson.deleteContactPerson.useMutation({
        onSuccess: async () => {
            toast.success("Contact person deleted successfully!");
            await Promise.all([
                utils.scContactPerson.getContactPersons.invalidate(),
                utils.scContactPerson.searchContactPersons.invalidate() 
            ]);
        },
    });

    const { 
        deleteID, isLoadingDelete, deleteClicked, setDeleteClicked, handleDeleteClicked, handleDeleteConfirmed 
    } = useDeleteConfirmation({
        mutation: deleteMutation,
        successMessage: 'Contact person deleted successfully',
        payloadBuilder: id => ({ id: safeNumber(id) }),
    });

    return (
        <>
            <Wrapper
                heading ="Contact Persons"
                subSectionLeft={
                    <SearchField
                        placeholder="Search contact persons..."
                        infoText="Name, Email, pabx, and contact number"
                        handleSearchChange={handleSearchChange}
                    />
                }
                subSectionRight={
                    can_add ? ( 
                        <div className="w-70">
                            <Button
                                variant="secondary"
                                label='Add Contact Person'
                                leftIcon={plusIcon}
                                onClick={() => router.push('/maintenance/sc_contact_person/new')}
                            />
                        </div>
                    ) : null
                }
            >
                <div className="w-full">
                    <Table
                        data={searchQuery.data?.contactPersons && !!debouncedSearch 
                            ? searchQuery.data.contactPersons : contactPersonsList
                        }
                        isLoading={isLoading || searchQuery.isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={searchQuery.data?.contactPersons && searchQuery.data.contactPersons.length > 0 
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
                    searchQuery.data?.contactPersons && !!debouncedSearch 
                        ? searchQuery.data.contactPersons : contactPersonsList
                ).find(contactPerson => contactPerson.id === safeNumber(deleteID))?.name}"?`}
                actionLabel="DELETE"
                negativeAction={true}
                loading={isLoadingDelete}
                action={handleDeleteConfirmed}
            />
        </>
    );
};

export default ScContactPersonPage;