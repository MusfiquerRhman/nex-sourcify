'use client';

import React, { useState } from "react";
import { Heading } from "~/components";
import { type BrandsState } from "~/types/merchandising";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import { DeleteButton } from "./deleteButton";
import BrandFrom from "./brandFrom";
import Departments from "./departments";

type BrandsProps = {
    brands: BrandsState | undefined;
    setBrands: React.Dispatch<React.SetStateAction<BrandsState | undefined>>;
    canDelete?: boolean;
}

const Brands = (props: BrandsProps) => {
    const { brands, setBrands, canDelete } = props;

    const [newBrand, setNewBrand] = useState("");
    const [newDepartments, setNewDepartments] = useState<Record<number, string>>({});
    const [newSizes, setNewSizes] = useState<Record<string, string>>({});

    const handleAddBrands = (brand: string) => {
        const value = brand.trim();
        if (!value) return;

        setBrands((prevBrands) => {
            if (!prevBrands) {
                return { buyer_brands: [{ brand: brand, buyer_departments: [] }] };
            }
            return {
                buyer_brands: [
                    ...prevBrands.buyer_brands,
                    { brand: brand, buyer_departments: [] }
                ]
            };
        });
    }

    const utils = api.useUtils();

    const deleteBrandsMutation = api.buyers.deleteBrands.useMutation({
        onSuccess: async () => {
            toast.success("Brand deleted successfully");
            await utils.buyers.getBuyerById.invalidate();
        },
    });
    
    const handleRemoveBrands = async (brandIndex: number, id?: number) => {
        setBrands((prevBrands) => {
            if (!prevBrands) return prevBrands;
            const updatedBrands = prevBrands.buyer_brands.filter((_, index) => index !== brandIndex);
            return { buyer_brands: updatedBrands };
        });

        if(!!id) {
            try {
                await deleteBrandsMutation.mutateAsync({ id });
            }
            catch (error) {
                const parsedError = parseTRPCError(error);
                toast.error("Failed to delete brand: " + parsedError);
            }
        }
    }

    return (
        <div className="m-8">
            <Heading as='h2'>Brands, Departments and Size Sets</Heading>
            <div className="flex flex-col gap-4">
                {brands?.buyer_brands.map((brand, brandIndex) => (
                    <div  key={brandIndex} className="flex-1 emboss p-4 rounded-lg">
                        <p className="py-2">Brand</p>
                        <div className="flex flex-row justify-between items-center border-2 border-primary rounded-lg pl-2">
                            <p className="text-xl font-semibold">{brand.brand}</p>
                            {canDelete && (
                                <DeleteButton size="lg"
                                    onClick={() => handleRemoveBrands(brandIndex, brand?.id)}
                                />
                            )}
                        </div>
                        <Departments 
                            canDelete={canDelete}
                            departments={brand.buyer_departments}
                            setBrands={setBrands}
                            newSizes={newSizes}
                            setNewSizes={setNewSizes}
                            brandIndex={brandIndex}
                            newDepartments={newDepartments}
                            setNewDepartments={setNewDepartments}
                        />
                    </div>
                ))}
                <BrandFrom
                    newBrand={newBrand}
                    setNewBrand={setNewBrand}
                    handleAddBrands={handleAddBrands}
                />
            </div>
        </div>
    )
}

export default Brands;