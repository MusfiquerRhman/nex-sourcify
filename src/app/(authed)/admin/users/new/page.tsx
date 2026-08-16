'use client';

import { Form, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";
import { useUserForm } from "../config/useUserForm";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";

const NewUserPage = () => {
    // Form setup
    const { methods, handleSubmit, fields, validationError, control } = useUserForm();
    const [isLoading, setIsLoading] = useState(false);
    
    // TRPC utils
    const utils = api.useUtils();

    const addUser = api.users.addUser.useMutation({
        onSuccess: async () => {
            toast.success("User added successfully!");
            await utils.users.getUsers.invalidate();
        },
    });

    const onSubmit = useCallback(handleSubmit(async (data) => {
        setIsLoading(true);

        const payload = {
            ...data,
            department_id: data.department_id != null ? String(data.department_id) : data.department_id,
            level_id: data.level_id != null ? String(data.level_id) : data.level_id,
        };

        try {
            await addUser.mutateAsync(payload);
        }
        catch(error) {
            const message = parseTRPCError(error);
            toast.error(`Error adding user: ${message}`);
        }
        finally {
            setIsLoading(false);
        }
    }), [addUser]);
    
    return (
        <Wrapper heading='Add User' >
            <Form fields={fields} 
                onSubmit={onSubmit} 
                buttonLabel="Add New User" 
                register={methods.register} 
                validationError={validationError} 
                isLoading={isLoading}
                control={control}
            />
        </Wrapper>
    )
}

export default NewUserPage;