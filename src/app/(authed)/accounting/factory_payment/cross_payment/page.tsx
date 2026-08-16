'use client';
import { useRouter } from "next/navigation";
import { plusIcon } from "~/assets";
import { Button, SearchField, Table, Wrapper, Popup } from "~/components";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { tableHeaders } from "./config/columns";
import { useSearchablePagination, useModulePermissions, useDeleteConfirmation } from "~/hooks";


const FactoryPaymentPage = () => {
    const router = useRouter();
    const utils = api.useUtils();

    const { page, limit, debouncedSearch, handleSearchChange, nextPage, prevPage } = useSearchablePagination();

    const { can_add, can_update, can_delete } = useModulePermissions();

    const {data: crossPayments, isLoading} = api.crossPayments.getCrossPaymentList.useQuery({
        limit,
        offset: page * limit,
    });

    const crossPaymentList = crossPayments?.crossPayments ?? [];
    const total = crossPayments?.total ?? 0;
    const editURL = '/accounting/factory_payment/cross_payment/edit/';

    const searchQuery = api.crossPayments.searchCrossPayments.useQuery(
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );

    const deleteMutation = api.crossPayments.deleteCrossPayment.useMutation({
        onSuccess: async () => {
            await Promise.all([
                utils.crossPayments.getCrossPaymentList.invalidate(),
                utils.crossPayments.searchCrossPayments.invalidate(),
            ]);
        }
    });

    const { 
        deleteID, isLoadingDelete, deleteClicked, setDeleteClicked, handleDeleteClicked, handleDeleteConfirmed 
    } = useDeleteConfirmation({
        mutation: deleteMutation,
        successMessage: 'Cross Payment deleted successfully',
        payloadBuilder: id => ({ cross_payment_id: id }),
    });

    return (
        <>
            <Wrapper
                heading="Cross Payments"
                subSectionLeft={
                    <SearchField
                        placeholder="Search Cross Payments..."
                        infoText="Cross Payment Reference, Buyer Name, Term and Factory Invoice."
                        handleSearchChange={handleSearchChange}
                    />
                }
                subSectionRight={
                    can_add ? (
                        <div className="w-70">
                            <Button
                                variant="secondary"
                                label="Add New Cross Payment"
                                leftIcon={plusIcon}
                                onClick={() => router.push('/accounting/factory_payment/cross_payment/new')}
                            />
                        </div>
                    ) : null
                }
            >
                <div className="w-full">
                    <Table
                        data={searchQuery.data?.crossPayments && !!debouncedSearch 
                            ? searchQuery.data.crossPayments : crossPaymentList
                        }
                        isLoading={isLoading || searchQuery.isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={searchQuery.data?.crossPayments && searchQuery.data.crossPayments.length > 0 
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
                    searchQuery.data?.crossPayments && !!debouncedSearch 
                        ? searchQuery.data.crossPayments : crossPaymentList
                ).find((crossPayment) => crossPayment.id === deleteID)?.id}"?`}
                actionLabel="DELETE"
                negativeAction={true}
                loading={isLoadingDelete}
                action={handleDeleteConfirmed}
            />
        </>
    )
}

export default FactoryPaymentPage;