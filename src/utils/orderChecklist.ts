import { z } from "zod";

export const technicalCheckSchema = z.union([z.literal(1), z.literal(-1), z.literal(0)]);
export type TechnicalCheck = z.infer<typeof technicalCheckSchema>;

export const technicalCheckOptions = [
    { label: "YES", value: 1 },
    { label: "NO", value: -1 },
    { label: "N/A", value: 0 },
];

export const getTechnicalCheckValue = (value: number | null | undefined): TechnicalCheck => value === 1 ? 1 : value === -1 ? -1 : 0;

export const formatTechnicalCheck = (value: number | null | undefined) => {
    return technicalCheckOptions.find((option) => option.value === (value ?? 0))?.label ?? "-";
};
