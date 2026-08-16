'use client';
import { useRouter } from "next/navigation";
import { plusIcon } from "~/assets";
import { Button, SearchField, Table, Wrapper, Popup } from "~/components";
import { api } from "~/trpc/react";
import { tableHeaders } from "./config/columns";
import { useSearchablePagination, useModulePermissions, useDeleteConfirmation } from "~/hooks";

const DocumentSubmissionPage = () => {
    const router = useRouter();
    const utils = api.useUtils();

    const { page, limit, debouncedSearch, handleSearchChange, nextPage, prevPage } = useSearchablePagination();

    const { can_add, can_update, can_delete } = useModulePermissions();

    const { data: documentSubmissions, isLoading } = api.documentSubmission.getDocumentSubmission.useQuery({
        limit,
        offset: page * limit,
    });

    const documentSubmissionList = documentSubmissions?.documentSubmissions ?? []; 
    const total = documentSubmissions?.total ?? 0;
    const editURL = '/commercial/document_submission/edit/';

    const searchQuery = api.documentSubmission.searchDocumentSubmissions.useQuery({
        query: debouncedSearch,
        limit,
        offset: page * limit,
    }, { enabled: debouncedSearch.length > 0 });

    const deleteMutation = api.documentSubmission.deleteDocumentSubmission.useMutation({
        onSuccess: async () => {
            await Promise.all([
                utils.documentSubmission.getDocumentSubmission.invalidate(),
                utils.documentSubmission.searchDocumentSubmissions.invalidate(),
            ]);
        },
    });

    const { 
        deleteID, isLoadingDelete, deleteClicked, setDeleteClicked, handleDeleteClicked, handleDeleteConfirmed 
    } = useDeleteConfirmation({
        mutation: deleteMutation,
        successMessage: 'Document Submission deleted successfully',
        payloadBuilder: id => ({ id }),
    });

    return (
        <>
            <Wrapper
                heading="Document Submissions"
                subSectionLeft={
                    <SearchField
                        placeholder="Search Document Submissions..."
                        infoText="Document Submission No, Buyer Name, Payment Term, Invoice No, Factory Invoice No"
                        handleSearchChange={handleSearchChange}
                    />
                }
                subSectionRight={
                    can_add ? (
                        <div className="w-70">
                            <Button
                                variant="secondary"
                                label="Add Document Submission"
                                leftIcon={plusIcon}
                                onClick={() => router.push('/commercial/document_submission/new')}
                            />
                        </div>
                    ) : null
                }
            >
                <div className="w-full">
                    <Table
                        data={searchQuery.data?.documentSubmissions && !!debouncedSearch 
                            ? searchQuery.data.documentSubmissions : documentSubmissionList
                        }
                        isLoading={isLoading || searchQuery.isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={searchQuery.data?.documentSubmissions && searchQuery.data.documentSubmissions.length > 0 
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
                    searchQuery.data?.documentSubmissions && !!debouncedSearch 
                        ? searchQuery.data.documentSubmissions : documentSubmissionList
                ).find((documentSubmission) => documentSubmission.id === deleteID)?.fdbc_no}"?`}
                actionLabel="DELETE"
                negativeAction={true}
                loading={isLoadingDelete}
                action={handleDeleteConfirmed}
            />
        </>
    )
}

export default DocumentSubmissionPage;