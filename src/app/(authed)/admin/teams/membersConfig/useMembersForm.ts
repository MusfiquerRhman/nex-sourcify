import { useEffect, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { formFields } from "./tableFormFields";
import { tableFormSchema } from "./tableFormSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useWatch } from "react-hook-form";
import type { GetTeamByIdTypes } from "~/types/adminAPITypes";

type MembersFormValues = {
  members: {
    id?: number; 
    db_id?: string;
    user_id: string;
    department_name?: string;
    level_name?: string;
  }[];
};

const MemberFormSchema = z.object({
  members: z.array(tableFormSchema),
});

type UserMap = Map<string, { department_name: string; level_name: string }>;

export const useMembersForm = (userMap: UserMap, memberData?: GetTeamByIdTypes['teamMembers'] ) => {
    // Form setup
    const { reset, register, control, handleSubmit, formState: { errors: validationError }, trigger, setValue } = useForm<MembersFormValues>({
        resolver: zodResolver(MemberFormSchema),
        defaultValues: {
            members: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "members",
    });

    // Effect to reset form when factoryData changes
    useEffect(() => {
        if (memberData?.length) {
            reset({
                members: memberData.map(b => {
                    const user = userMap.get(String(b.user_id));
                    return {
                        db_id: b.id?.toString(), // keep this for edit/delete
                        user_id: b.user_id,
                        department_name: user?.department_name ?? "",
                        level_name: user?.level_name ?? "",
                    };
                }),
            });
        }
    }, [memberData, reset, userMap]);

    const addRow = () => {
        append({
            user_id: "",
            department_name: "",
            level_name: "",
        });
    }

    const watchedMembers = useWatch({
        control,
        name: "members",
    });

    const members = useMemo(() => {
        return watchedMembers ?? [];
    }, [JSON.stringify(watchedMembers)]);
    
    const userIds = (useWatch({
        control,
        name: "members",
    }) ?? []).map(m => m?.user_id);

    const userIdsDependency = JSON.stringify(userIds);

    useEffect(() => {
        if (!members?.length) return;

        members.forEach((member, index) => {
            if (!member?.user_id) return;

            const user = userMap.get(String(member.user_id));
            if (!user) return;

            // CRITICAL: Only update if the values are actually different
            // This prevents the infinite loop by stopping setValue calls 
            // once the form state matches the userMap data.
            if (
                member.department_name !== user.department_name || 
                member.level_name !== user.level_name
            ) {
                setValue(`members.${index}.department_name`, user.department_name, {
                    shouldDirty: true,
                });

                setValue(`members.${index}.level_name`, user.level_name, {
                    shouldDirty: true,
                });
            }
        });
    }, [userIdsDependency, members, userMap, setValue]);

    return {
        register,
        handleSubmit,
        fields,
        tableFormFields: formFields(),
        addRow,
        remove,
        validationError,
        trigger,
        control
    };
}