import { plusIcon } from "~/assets";
import { DeleteButton } from "./deleteButton";
import { Input } from "./inputs";
import type { BrandsState } from "~/types/merchandising";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import { api } from "~/trpc/react";
import Image from "next/image";

type SizesProps = {
    sizes: { size: string; id?: number }[];
    newSizes: Record<string, string>;
    setNewSizes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    setBrands: React.Dispatch<React.SetStateAction<BrandsState | undefined>>
    brandIndex: number;
    departmentIndex: number;
    canDelete?: boolean;
}

const Sizes = ({sizes, newSizes, setNewSizes, setBrands, brandIndex, departmentIndex, canDelete}: SizesProps) => {
    const handleAddSizeSet = (brandIndex: number, departmentIndex: number, size: string) => {
        const value = size.trim();
        if (!value) return;

        setBrands((prevBrands) => {
            if (!prevBrands) return prevBrands;
            const updatedBrands = prevBrands.buyer_brands.map((brand, bIndex) => {
                if (bIndex === brandIndex) {
                    const updatedDepartments = brand.buyer_departments.map((department, dIndex) => {
                        if (dIndex === departmentIndex) {
                            return {
                                ...department,
                                buyer_department_sizes: [
                                    ...department.buyer_department_sizes,
                                    { size: size }
                                ]
                            };
                        }
                        return department;
                    });
                    return { ...brand, buyer_departments: updatedDepartments };
                }
                return brand;
            });
            return { buyer_brands: updatedBrands };
        });
    }

    const utils = api.useUtils();

    const deleteSizeSetMutation = api.buyers.deleteSizeSet.useMutation({
        onSuccess: async () => {
            toast.success("Size set deleted successfully");
            await utils.buyers.getBuyerById.invalidate();
        },
    });

    const handleRemoveSizeSet = async (brandIndex: number, departmentIndex: number, sizeIndex: number, id?: number) => {
        setBrands((prevBrands) => {
            if (!prevBrands) return prevBrands;
            const updatedBrands = prevBrands.buyer_brands.map((brand, bIndex) => {
                if (bIndex === brandIndex) {
                    const updatedDepartments = brand.buyer_departments.map((department, dIndex) => {
                        if (dIndex === departmentIndex) {
                            const updatedSizes = department.buyer_department_sizes.filter((_, sIndex) => sIndex !== sizeIndex);
                            return { ...department, buyer_department_sizes: updatedSizes };
                        }
                        return department;
                    });
                    return { ...brand, buyer_departments: updatedDepartments };
                }
                return brand;
            });
            return { buyer_brands: updatedBrands };
        });

        if(!!id) {
            try {
                await deleteSizeSetMutation.mutateAsync({ id });
            }
            catch (error){
                toast.error("Failed to delete size set: " + parseTRPCError(error));
            }
        }
    }

    return (
        <div className="ml-2 border-l-2 border-secondary pl-4">
            <p className="py-1">Sizes</p>
            {sizes.map((sizeSet, sizeIndex) => (
                <div key={sizeIndex} className="flex flex-row justify-between items-center border-2 border-gray-400 my-2 rounded-lg pl-2">
                     <p className={'p-1'}>{sizeSet.size}</p>
                    {canDelete && (
                        <DeleteButton size="sm"
                            onClick={() => handleRemoveSizeSet( brandIndex, departmentIndex, sizeIndex, sizeSet?.id ) }
                        />
                    )}
                </div>
            ))}
            <div className="flex gap-2 mt-2">
                <Input
                    placeholder="Size name"
                    value={newSizes[`${brandIndex}-${departmentIndex}`] ?? ""}
                    setValue={(value) =>
                        setNewSizes((prev) => ({
                            ...prev,
                            [`${brandIndex}-${departmentIndex}`]: value,
                        }))
                    }
                    onEnter={() => {
                        const value = newSizes[`${brandIndex}-${departmentIndex}`]?.trim();
                        if (!value) return;
                        handleAddSizeSet(brandIndex, departmentIndex, value);
                        setNewSizes((prev) => ({ ...prev, [`${brandIndex}-${departmentIndex}`]: "" }));
                    }}
                />
                <button
                    className="p-2 invert rounded-lg my-1"
                    disabled={!newSizes[ `${brandIndex}-${departmentIndex}`]?.trim()}
                    onClick={() => {
                        handleAddSizeSet(
                            brandIndex,
                            departmentIndex,
                            (newSizes[ `${brandIndex}-${departmentIndex}`] ?? "").trim()
                        );
                        setNewSizes((prev) => ({ ...prev, [ `${brandIndex}-${departmentIndex}`]: "" }));
                    }}
                >
                    <div className="h-5 w-5 hover:cursor-pointer">
                        <Image width={20} height={20} src={plusIcon.src} alt="Add Size" />
                    </div>
                </button>
            </div>
        </div>
    )
}

export default Sizes;