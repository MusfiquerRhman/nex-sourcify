import { plusIcon } from "~/assets";
import { DeleteButton } from "./deleteButton";
import { Input } from "./inputs";
import Sizes from "./sizes";
import type { BrandsState } from "~/types/merchandising";
import { api } from "~/trpc/react";
import { parseTRPCError } from "~/utils/parseTRPCError";
import { toast } from "sonner";
import Image from "next/image";

type DepartmentsProps = {
    departments: { department: string; id?: number; buyer_department_sizes: { size: string; id?: number }[] }[];
    setBrands: React.Dispatch<React.SetStateAction<BrandsState | undefined>>;
    newSizes: Record<string, string>;
    setNewSizes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    brandIndex: number;
    newDepartments: Record<number, string>;
    setNewDepartments: React.Dispatch<React.SetStateAction<Record<number, string>>>;
    canDelete?: boolean;
}

const Departments = ({departments, setBrands, newSizes, setNewSizes, brandIndex, newDepartments, setNewDepartments, canDelete}: DepartmentsProps) => {
    const utils = api.useUtils();

    const handleAddDepartment = (brandIndex: number, department: string) => {
        const value = department.trim();
        if (!value) return;

        setBrands((prevBrands) => {
            if (!prevBrands) return prevBrands;
            const updatedBrands = prevBrands.buyer_brands.map((brand, index) => {
                if (index === brandIndex) {
                    return {
                        ...brand,
                        buyer_departments: [
                            ...brand.buyer_departments,
                            { department: department, buyer_department_sizes: [] }
                        ]
                    };
                }
                return brand;
            });
            return { buyer_brands: updatedBrands };
        });
    }
    
    const deleteDepartmentMutation = api.buyers.deleteDepartment.useMutation({
        onSuccess: async () => {
            toast.success("Department deleted successfully");
            await utils.buyers.getBuyerById.invalidate();
        },
    });

    const handleRemoveDepartment = async (brandIndex: number, departmentIndex: number, id?: number) => {
        setBrands((prevBrands) => {
            if (!prevBrands) return prevBrands;
            const updatedBrands = prevBrands.buyer_brands.map((brand, bIndex) => {
                if (bIndex === brandIndex) {
                    const updatedDepartments = brand.buyer_departments.filter((_, dIndex) => dIndex !== departmentIndex);
                    return { ...brand, buyer_departments: updatedDepartments };
                }
                return brand;
            });
            return { buyer_brands: updatedBrands };
        });

        if(!!id) {
            try {
                await deleteDepartmentMutation.mutateAsync({ id });
            }
            catch(error){
                toast.error("Failed to delete department: " + parseTRPCError(error));
            }
        }
    }
    
    return (
        <div className="ml-2 border-l-2 border-primary pl-4">
            {departments.map((department, departmentIndex) => (
                <div key={departmentIndex} className="mb-4">
                    <p className="py-2">Department</p>
                    <div className="flex flex-row justify-between items-center border-2 border-secondary rounded-lg pl-2">
                        <p className="text-xl font-medium">{department.department}</p>
                        {canDelete && (
                            <DeleteButton size="md"
                                onClick={() => handleRemoveDepartment(brandIndex, departmentIndex, department?.id) }
                            />
                        )}
                    </div>
                    <Sizes
                        sizes={department.buyer_department_sizes}
                        newSizes={newSizes}
                        setNewSizes={setNewSizes}
                        setBrands={setBrands}
                        brandIndex={brandIndex}
                        departmentIndex={departmentIndex}
                        canDelete={canDelete}
                    />
                </div>
            ))}
            <div className="flex gap-2 mt-2">
                <Input
                    placeholder="Department name"
                    value={newDepartments[brandIndex] ?? ""}
                    setValue={(value) =>
                        setNewDepartments((prev) => ({
                            ...prev,
                            [brandIndex]: value,
                        }))
                    }
                    onEnter={() => {
                        const value = newDepartments[brandIndex]?.trim();
                        if (!value) return;
                        handleAddDepartment(brandIndex, value);
                        setNewDepartments((prev) => ({ ...prev, [brandIndex]: "" }));
                    }}
                />
                <button
                    className="p-2 invert rounded-lg my-1"
                    disabled={!newDepartments[brandIndex]?.trim()}
                    onClick={() => {
                        handleAddDepartment(brandIndex, (newDepartments[brandIndex] ?? "").trim());
                        setNewDepartments((prev) => ({ ...prev, [brandIndex]: "" }));
                    }}
                >
                    <div className="h-5 w-5 hover:cursor-pointer">
                        <Image width={20} height={20} src={plusIcon.src} alt="Add Department" />
                    </div>
                </button>
            </div>
        </div>
    )
}

export default Departments;