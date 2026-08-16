'use client';

import { Form, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";
import { useUserForm } from "../../config/useUserForm";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import type { ParamsProp } from "~/types/params";

const EditUserPage = ({ params }: ParamsProp) => {
    const { id } = React.use(params);

    const { data: userData, isLoading } = api.users.getUser.useQuery({ id: id });

    // Form setup
    const { methods, handleSubmit, fields, validationError, control } = useUserForm(userData);

    const [isUpdateLoading, setIsUpdateLoading] = useState(false)

    const utils = api.useUtils();

    const updateUser = api.users.updateUser.useMutation({
        onSuccess: async () => {
            toast.success("User updated successfully!");
            await utils.users.getUsers.invalidate();
        },
    });

    const onSubmit = useCallback(handleSubmit(async (data) => {
        setIsUpdateLoading(true);
        const { ...payload } = data;
        const user = {
            id: userData?.id ?? '',
            ...payload,
            department_id: data.department_id ?? data.department_id,
            level_id: data.level_id ?? data.level_id,
        };

        try {
            await updateUser.mutateAsync(user);
        } catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error updating user: ${message}`);
        } finally {
            setIsUpdateLoading(false);
        }
    }), [updateUser, userData]);

    return (
        <Wrapper heading='Update User' >
            <Form fields={fields} 
                onSubmit={onSubmit} 
                buttonLabel="Update User" 
                register={methods.register} 
                validationError={validationError} 
                isLoading={isLoading || isUpdateLoading}
                control={control}
            />
        </Wrapper>
    )
}

export default EditUserPage;
