'use client';
import { useRouter } from "next/navigation";
import { plusIcon } from "~/assets";
import { Button, SearchField, Table, Wrapper, Popup } from "~/components";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { tableHeaders } from "./config/columns";
import { useSearchablePagination, useModulePermissions, useDeleteConfirmation } from "~/hooks";
import { safeNumber } from "~/utils/numbers";

const ShipmentTolerancePage = () => {
    const router = useRouter();
    const utils = api.useUtils();
    
    const { page, limit, debouncedSearch, handleSearchChange, nextPage, prevPage } = useSearchablePagination();
    
    const { can_add, can_update, can_delete } = useModulePermissions();

    // Fetch paginated data
    const {data: toleranceLevels, isLoading} = api.toleranceLevel.getTolerance.useQuery({
        limit,
        offset: page * limit,
    });

    const toleranceLevelList = toleranceLevels?.toleranceLevels ?? [];
    const total = toleranceLevels?.total ?? 0;

    // Search query (enabled only when there's a search term)
    const searchQuery = api.toleranceLevel.searchTolerance.useQuery(
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );

    const editURL = '/maintenance/shipment_tolerance/edit/';

    const deleteMutation = api.toleranceLevel.deleteTolerance.useMutation({
        onSuccess: async () => {
            toast.success("Tolerance level deleted successfully!");
            await Promise.all([
                utils.toleranceLevel.getTolerance.invalidate(),
                utils.toleranceLevel.searchTolerance.invalidate(),
            ]);
        },
    });

    const { 
        deleteID, isLoadingDelete, deleteClicked, setDeleteClicked, handleDeleteClicked, handleDeleteConfirmed 
    } = useDeleteConfirmation({
        mutation: deleteMutation,
        successMessage: 'Shipment tolerance deleted successfully',
        payloadBuilder: id => ({ id: safeNumber(id) }),
    });
    
    return (
        <>
            <Wrapper
                heading="Shipment Tolerance"
                subSectionLeft={
                    <SearchField
                        placeholder="Search Shipment Tolerance..."
                        infoText="Shipment Tolerance."
                        handleSearchChange={handleSearchChange}
                    />
                }
                subSectionRight={
                    can_add ? (
                        <div className="w-70">
                            <Button
                                variant="secondary"
                                label="Add New Shipment Tolerance"
                                leftIcon={plusIcon}
                                onClick={() => router.push('/maintenance/shipment_tolerance/new')}
                            />
                        </div>
                    ) : null
                }
            >
                <div className="w-full">
                    <Table
                        data={searchQuery.data?.toleranceLevels && !!debouncedSearch 
                            ? searchQuery.data.toleranceLevels : toleranceLevelList
                        }
                        isLoading={isLoading || searchQuery.isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={searchQuery.data?.toleranceLevels && searchQuery.data.toleranceLevels.length > 0 
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
                    searchQuery.data?.toleranceLevels && !!debouncedSearch 
                        ? searchQuery.data.toleranceLevels : toleranceLevelList
                ).find(toleranceLevel => toleranceLevel.id === safeNumber(deleteID))?.buyer_name}"?`}
                actionLabel="DELETE"
                negativeAction={true}
                loading={isLoadingDelete}
                action={handleDeleteConfirmed}
            />
        </>
    );
};
    
export default ShipmentTolerancePage;