'use client';
import { useRouter } from "next/navigation";
import { plusIcon } from "~/assets";
import { Button, SearchField, Table, Wrapper, Popup } from "~/components";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { tableHeaders } from "./config/columns";
import { useSearchablePagination, useModulePermissions, useDeleteConfirmation } from "~/hooks";
import { safeNumber } from "~/utils/numbers";

const ProductsPage = () => {
    const router = useRouter();
    const utils = api.useUtils();

    const { page, limit, debouncedSearch, handleSearchChange, nextPage, prevPage } = useSearchablePagination();

    const { can_add, can_update, can_delete } = useModulePermissions();
    
    // Fetch paginated data
    const {data: products, isLoading} = api.products.getProducts.useQuery({
        limit,
        offset: page * limit,
    });

    const productsList = products?.products ?? [];
    const total = products?.total ?? 0;

    // Search query (enabled only when there's a search term)
    const searchQuery = api.products.searchProducts.useQuery(
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );

    const editURL = '/library/products/edit/';

    const deleteMutation = api.products.deleteProduct.useMutation({
        onSuccess: async () => {
            toast.success("Product deleted successfully!");
            await Promise.all([
                utils.products.getProducts.invalidate(),
                utils.products.searchProducts.invalidate()
            ]);
        },
    });

    const { 
        deleteID, isLoadingDelete, deleteClicked, setDeleteClicked, handleDeleteClicked, handleDeleteConfirmed 
    } = useDeleteConfirmation({
        mutation: deleteMutation,
        successMessage: 'Product deleted successfully',
        payloadBuilder: id => ({ id: safeNumber(id) }),
    });

    return (
        <>
            <Wrapper
                heading ="Products"
                subSectionLeft={
                    <SearchField
                        placeholder="Search products..."
                        infoText="Name, Type, Stats"
                        handleSearchChange={handleSearchChange}
                    />
                }
                subSectionRight={
                    can_add ? ( 
                        <div className="w-70">
                            <Button
                                variant="primary"
                                label='Add Product'
                                leftIcon={plusIcon}
                                onClick={() => router.push('/library/products/new')}
                            />
                        </div>
                    ) : null
                }
            >
                <div className="w-full">
                    <Table
                        data={searchQuery.data?.products && !!debouncedSearch 
                            ? searchQuery.data.products : productsList
                        }
                        isLoading={isLoading || searchQuery.isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={searchQuery.data?.products && searchQuery.data.products.length > 0 
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
                    searchQuery.data?.products && !!debouncedSearch 
                        ? searchQuery.data.products : productsList
                ).find(product => product.id === safeNumber(deleteID))?.name}"?`}
                actionLabel="DELETE"
                negativeAction={true}
                loading={isLoadingDelete}
                action={handleDeleteConfirmed}
            />
        </>
    );
};

export default ProductsPage;
        