'use client';

import { Button, Form, Wrapper } from "~/components";
import React, { useState } from "react";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";

import { useTeamsForm } from "../config/useTeamsForm";
import { type FormValues } from "../config/formSchema";

import { useMembersForm } from "../membersConfig/useMembersForm";
import { tableFormColumns as membersTableFormColumns } from "../membersConfig/tableFormColumns";
import { type TableFormValues as MembersFormValues } from "../membersConfig/tableFormSchema";
import TableForm from "~/components/organisms/table/TableForm";
import { safeNumber } from "~/utils/numbers";

const NewTeamPage = () => {
    // Form setup
    const { methods, handleSubmit, formFields, validationError, trigger, control } = useTeamsForm();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const users = api.users.getAllUsers.useQuery();
    const userMap = new Map<string, { 
        id: string; 
        user_id: string; 
        department_name: string; 
        level_name: string; 
    }>();

    // Create a map of user ID to user details for easy lookup
    users.data?.forEach((user) => {
        if (user.id !== undefined && user.user_id !== null) {
            userMap.set(String(user.id), {
                id: user.id,
                user_id: user.user_id,
                department_name: user.department_name,
                level_name: user.level_name ?? '',
            });
        }
    });

    const { 
        register: membersRegister,
        handleSubmit: handleMembersSubmit,
        tableFormFields: membersTableFormFields,
        fields: membersFields,
        addRow: membersAddRow,
        remove: removeMembers,
        validationError: membersTableValidationError,
        trigger: membersTrigger,
        control: membersControl,
    } = useMembersForm(userMap);

    const utils = api.useUtils();

    const addTeamMutation = api.teams.addTeam.useMutation({
        onSuccess: async () => {
            toast.success("Team created successfully!");
            await utils.teams.getTeams.invalidate();
            setError(null);
        },
    });

    const submitAll = async () => {
        try {
            // Trigger validation for both forms before submission
            await trigger();
            await membersTrigger();

            const teamData = await new Promise<FormValues>((resolve, reject) => {
                void handleSubmit((formData) => resolve(formData), (formErrors) => reject(new Error(JSON.stringify(formErrors))))();
            });

            const membersData = await new Promise<MembersFormValues[]>((resolve, reject) => {
                void handleMembersSubmit((data) => resolve(data.members), (formErrors) => reject(new Error(JSON.stringify(formErrors))))();
            });

            setIsLoading(true);

            const payload = {
                ...teamData,
                buyer_id: teamData.buyer_id ? safeNumber(teamData.buyer_id) : null,
                membersData: membersData,
            };

            await addTeamMutation.mutateAsync(payload);
        }
        catch (err) {
            const parsedError = parseTRPCError(err);
            setError(parsedError);
        }
        finally {
            setIsLoading(false);
        }
    };

    const removeMembersRow = (index: number) => {
        removeMembers(index);
    }

    const getMembersValidationError = () => {
        if (!membersTableValidationError.members || !Array.isArray(membersTableValidationError.members)) {
            return undefined;
        }
        const errorRecord: Record<string, string> = {};
        membersTableValidationError.members.forEach((error, index) => {
            if (error && typeof error === 'object' && 'message' in error && typeof (error as Record<string, unknown>).message === 'string') {
                errorRecord[`row_${index}`] = (error as Record<string, unknown>).message as string;
            }
        });
        return Object.keys(errorRecord).length > 0 ? errorRecord : undefined;
    }

    return (    
        <>  
            <Wrapper heading="Create New Team">
                <Form fields={formFields} 
                    buttonLabel="Add New Buyer" 
                    register={methods.register}
                    isLoading={isLoading}
                    validationError={validationError}
                    error={error}
                    disabled={isLoading}
                    control={control}
                />
                <TableForm 
                    title={"Team Members"}
                    name="members"
                    isLoading={isLoading}
                    fields={membersTableFormFields}
                    rows={membersFields}
                    columns={membersTableFormColumns}
                    register={membersRegister}
                    addRow={membersAddRow}
                    removeRow={removeMembersRow}
                    validationError={getMembersValidationError()}
                    disabled={isLoading}
                    control={membersControl}
                />
                <div className="w-full flex flex-row justify-end">
                    <Button type="button" 
                        onClick={() => submitAll()}
                        label={"Add New Buyer"} 
                        className="text-lg tracking-wide m-8 max-w-80"
                        disabled={isLoading}
                    />
                </div>
            </Wrapper>
        </>
    );
}

export default NewTeamPage;