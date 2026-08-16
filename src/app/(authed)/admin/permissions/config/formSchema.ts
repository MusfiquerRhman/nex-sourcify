import z from 'zod';

export const formSchema = z.object({
    level_id: z.number({invalid_type_error: "Select a level"}).min(1, 'Level is required'),
    department_id: z.number({invalid_type_error: "Select a department"}).min(1, 'Department is required'),
});

export type FormValues = z.infer<typeof formSchema>;