import { api } from "~/trpc/react";
import type { StyleFormValues } from "./tableFormSchema";
import type { BaseField } from "~/types/form";
import { skipToken } from "@tanstack/react-query";

export type Field<T extends keyof StyleFormValues> = BaseField<T>;

export const formFields = ({productTypeId}: {productTypeId: number | undefined}): Field<keyof StyleFormValues>[] => {

    const productTypes = api.productType.getAll.useQuery();

    const { data: products } = api.products.getProductByProductTypeId.useQuery(
        !!productTypeId ? { product_type_id: productTypeId } : skipToken,
    );

    const { data: fabrics } = api.fabrics.getFabricsByProductTypeId.useQuery(
        !!productTypeId ? { product_type_id: productTypeId } : skipToken,
    );

    const fabricSuppliers = api.fabricSuppliers.getAll.useQuery().data ?? [];

    return [
        {
            name: "product_type_id",
            label: "Product Type",
            placeholder: "Select product type",
            type: "select",
            options: productTypes.data?.map((pt) => ({ label: pt.name, value: pt.id.toString() })) ?? [],
        },
        {
            name: "product_id", 
            label: "Product",
            placeholder: "Select product",
            type: "select",
            options: products?.map((p) => ({ label: p.name, value: p.id.toString() })) ?? [],
        },
        {
            name: 'style',
            label: 'Style',
            placeholder: 'Enter style',
        },
        {
            name: "fabric_id",
            label: "Fabric",
            placeholder: "Select fabric",
            type: "select",
            options: fabrics?.map((f) => ({ label: f.name ?? '', value: f.id.toString() })) ?? [],
        },
        {
            name: "supplier_id",
            label: "Fabric Supplier",
            placeholder: "Select fabric supplier",
            type: "select",
            options: fabricSuppliers.map((fs) => ({ label: fs.name, value: fs.id.toString() })) ?? [],
        },
        {
            name: 'order_quantity',
            label: 'Quantity',
            placeholder: 'Enter quantity',
            type: 'number',
        }
    ]
}