'use client';
import { useRouter } from "next/navigation";
import { plusIcon } from "~/assets";
import { Button, SearchField, Table, Wrapper, Popup } from "~/components";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { tableHeaders } from "./config/columns";
import { useSearchablePagination, useModulePermissions, useDeleteConfirmation } from "~/hooks";

const TNATemplates = () => {
    const router = useRouter();
    const utils = api.useUtils();

    const { page, limit, debouncedSearch, handleSearchChange, nextPage, prevPage } = useSearchablePagination();

    const { can_add, can_update, can_delete } = useModulePermissions();

    // Fetch paginated data
    const {data: tnaTemplates, isLoading} = api.commercialTnaTemplates.getTnaTemplates.useQuery({
        limit,
        offset: page * limit,
    });

    const tnaTemplatesList = tnaTemplates?.templates ?? [];
    const total = tnaTemplates?.count ?? 0;

    // Search query (enabled only when there's a search term)
    const searchQuery = api.commercialTnaTemplates.searchTnaTemplates.useQuery(
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );

    const editURL = '/commercial/tna/tna_templates/edit/';

    const deleteMutation = api.commercialTnaTemplates.deleteTnaTemplate.useMutation({
        onSuccess: async () => {
            toast.success("TNA Template deleted successfully!");
            await Promise.all([
                utils.commercialTnaTemplates.getTnaTemplates.invalidate(),
                utils.commercialTnaTemplates.searchTnaTemplates.invalidate()
            ]);
        },
    });

    const { 
        deleteID, isLoadingDelete, deleteClicked, setDeleteClicked, handleDeleteClicked, handleDeleteConfirmed 
    } = useDeleteConfirmation({
        mutation: deleteMutation,
        successMessage: 'TNA Template deleted successfully',
        payloadBuilder: id => ({ id }),
    });

    return (
        <>
            <Wrapper
                heading="Commercial TNA Templates"
                subSectionLeft={
                    <SearchField
                        placeholder="Search TNA Templates..."
                        infoText="Template Name, Buyer Name, Brand, and Department."
                        handleSearchChange={handleSearchChange}
                    />
                }
                subSectionRight={
                    can_add ? (
                        <div className="w-70">
                            <Button
                                variant="secondary"
                                label="Add New TNA Template"
                                leftIcon={plusIcon}
                                onClick={() => router.push('/commercial/tna/tna_templates/new')}
                            />
                        </div>
                    ) : null
                }
            >
                <div className="w-full">
                    <Table
                        data={searchQuery.data?.templates && !!debouncedSearch 
                            ? searchQuery.data.templates : tnaTemplatesList
                        }
                        isLoading={isLoading || searchQuery.isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={searchQuery.data?.templates && searchQuery.data.templates.length > 0 
                            ? searchQuery.data.count ?? 0 : total
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
                    searchQuery.data?.templates && !!debouncedSearch 
                        ? searchQuery.data.templates : tnaTemplatesList
                ).find(template => template.id === deleteID)?.template_name}"?`}
                actionLabel="DELETE"
                negativeAction={true}
                loading={isLoadingDelete}
                action={handleDeleteConfirmed}
            />
        </>
    )
}

export default TNATemplates;