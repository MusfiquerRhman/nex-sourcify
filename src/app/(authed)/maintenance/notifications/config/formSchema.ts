import { notification_types } from "@prisma/client";
import z from "zod";

const optionalDate = z.string().date("Enter a valid date").or(z.literal("")).optional();

export const notificationFilters = z
    .object({
        db_id: z.string().optional(),
        module_id: z.number().int().nonnegative().optional(),
        from_date: optionalDate,
        to_date: optionalDate,
        recipients_ids: z.array(z.string().uuid()).optional(),
        level_id: z.number().int().nonnegative().optional(),
        department_id: z.number().int().nonnegative().optional(),
    })
    .refine((values) => !values.from_date || !values.to_date || values.from_date <= values.to_date, {
        message: "To Date must be on or after From Date",
        path: ["to_date"],
    });

export type NotificationFiltersValues = z.infer<typeof notificationFilters>;

export const notificationFormSchema = z.object({
    title: z.string().trim().min(1, "Title is required").max(70, "Title must be 70 characters or fewer"),
    description: z.string().trim().min(1, "Description is required"),
    level_id: z.number().int().nonnegative().optional(),
    department_id: z.number().int().nonnegative().optional(),
    event_type: z.nativeEnum(notification_types),
});

export type NotificationFormValues = z.infer<typeof notificationFormSchema>;
