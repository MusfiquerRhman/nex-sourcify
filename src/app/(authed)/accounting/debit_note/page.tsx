'use client';
import { useRouter } from "next/navigation";
import { plusIcon } from "~/assets";
import { Button, SearchField, Table, Wrapper, Popup } from "~/components";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { tableHeaders } from "./config/columns";
import { useSearchablePagination, useModulePermissions, useDeleteConfirmation } from "~/hooks";
import { useEffect } from "react";

const DebitNotePage = () => {
    const router = useRouter();
    const utils = api.useUtils();

    const { page, limit, debouncedSearch, handleSearchChange, nextPage, prevPage } = useSearchablePagination();

    const { can_add, can_update, can_delete } = useModulePermissions();

    const {data: debitNotes, isLoading} = api.debitNotes.getAllDebitNotes.useQuery({
        limit,
        offset: page * limit,
    });

    const debitNoteList = debitNotes?.debitNotes ?? [];
    const total = debitNotes?.total ?? 0;
    const editURL = '/accounting/debit_note/edit/';
    const pdfURL = '/pdf/debit_note/';

    const searchQuery = api.debitNotes.searchDebitNotes.useQuery(
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );

    useEffect(() => {
        console.log(searchQuery.data?.debitNotes)
    }, [searchQuery.data?.debitNotes])

    const deleteMutation = api.debitNotes.deleteDebitNote.useMutation({
        onSuccess: async () => {
            await Promise.all([
                utils.debitNotes.getAllDebitNotes.invalidate(),
                utils.debitNotes.searchDebitNotes.invalidate(),
            ]);
            toast.success('Debit Note deleted successfully');
        }
    });

    const { 
        deleteID, isLoadingDelete, deleteClicked, setDeleteClicked, handleDeleteClicked, handleDeleteConfirmed 
    } = useDeleteConfirmation({
        mutation: deleteMutation,
        successMessage: 'Debit Note deleted successfully',
        payloadBuilder: id => ({ debit_note_id: id }),
    });

   return (
        <>
            <Wrapper
                heading="Debit Notes"
                subSectionLeft={
                    <SearchField
                        placeholder="Search Debit Notes..."
                        infoText="Debit Note No, Buyer Name, Payment Term, PO, Factory Name, LC no and Sales Contract No"
                        handleSearchChange={handleSearchChange}
                    />
                }
                subSectionRight={
                    can_add ? (
                        <div className="w-70">
                            <Button
                                variant="secondary"
                                label="Add Debit Note"
                                leftIcon={plusIcon}
                                onClick={() => router.push('/accounting/debit_note/new')}
                            />
                        </div>
                    ) : null
                }
            >
                <div className="w-full">
                    <Table
                        data={searchQuery.data?.debitNotes && !!debouncedSearch 
                            ? searchQuery.data.debitNotes : debitNoteList
                        }
                        isLoading={isLoading || searchQuery.isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={searchQuery.data?.debitNotes && searchQuery.data.debitNotes.length > 0 
                            ? searchQuery.data.total ?? 0 : total
                        }
                        deleteFunction={handleDeleteClicked}
                        page={page}
                        limit={limit}
                        editURL={editURL}
                        allowDelete={can_delete}
                        allowEdit={can_update}
                        view={!can_update}
                        allowPrint={true}
                        printURL={pdfURL}
                    />
                </div>
            </Wrapper>
            <Popup
                open={deleteClicked}
                onClose={() => setDeleteClicked(false)}
                heading="Confirm Deletion"
                description={`Are you sure you want to delete "${(
                    searchQuery.data?.debitNotes && !!debouncedSearch 
                        ? searchQuery.data.debitNotes : debitNoteList
                ).find((debitNote) => debitNote.id === deleteID)?.debit_note_ref}"?`}
                actionLabel="DELETE"
                negativeAction={true}
                loading={isLoadingDelete}
                action={handleDeleteConfirmed}
            />
        </>
    )
}

export default DebitNotePage;