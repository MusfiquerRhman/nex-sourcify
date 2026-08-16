'use client';

import { Button, Form, Wrapper } from "~/components";
import React, { useMemo, useState } from "react";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";

import { useNavigationStore, usePermissionStore } from "~/store";
import { useModulePath } from "~/hooks";

import { useTeamsForm } from "../../config/useTeamsForm";
import { type FormValues } from "../../config/formSchema";

import { useMembersForm } from "../../membersConfig/useMembersForm";
import { tableFormColumns as membersTableFormColumns } from "../../membersConfig/tableFormColumns";
import { type TableFormValues as MembersFormValues } from "../../membersConfig/tableFormSchema";
import TableForm from "~/components/organisms/table/TableForm";
import { safeNumber } from "~/utils/numbers";
import type { ParamsProp } from "~/types/params";

const EditTeamPage = ({ params }: ParamsProp) => {
    const { id } = React.use(params)
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Get current module path
    const modulePath = useModulePath().path;
        
    // Get current module permissions
    const pathId = useNavigationStore((s) => s.getByHref(modulePath));
    const permissions = usePermissionStore(s => (pathId ? s.permission[pathId] : undefined));
    const { can_update } = permissions ?? {};

    const users = api.users.getAllUsers.useQuery();

    const userMap = useMemo(() => {
        const map = new Map<
            string,
            {
                id: string;
                user_id: string;
                department_name: string;
                level_name: string;
            }
        >();

        users.data?.forEach((user) => {
            if (user.id !== undefined && user.user_id !== null) {
                map.set(String(user.id), {
                    id: user.id,
                    user_id: user.user_id,
                    department_name: user.department_name,
                    level_name: user.level_name ?? '',
                });
            }
        });

        return map;
    }, [users.data]);

    const { data: teamData, isLoading: isLoadingTeam } = api.teams.getTeamById.useQuery({ id: safeNumber(id) });
    // Form setup
    const { methods, handleSubmit, formFields, validationError, trigger, control } = useTeamsForm(teamData?.team);

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
    } = useMembersForm(userMap, teamData?.teamMembers);

    const utils = api.useUtils();

    const updateTeamMutation = api.teams.updateTeam.useMutation({
        onSuccess: async () => {
            toast.success("Team updated successfully!");
            await utils.teams.getTeams.invalidate();
            await utils.teams.getTeamById.invalidate({ id: safeNumber(id) });
            setIsLoading(false);
            setError(null);
        },
    });

    const submitAll = async () => {
        try {
            let teamData: FormValues | undefined;
            let membersData: MembersFormValues[] | undefined;

            // Trigger validation for both forms before submission
            await trigger();
            await membersTrigger();

            // If validation fails, the respective trigger functions will throw an error, 
            // which we catch in the catch block below. 
            // If validation passes, we proceed to gather the form data for submission.
            await handleSubmit(
                (data) => {
                    teamData = {
                        ...data,
                    };
                },
                (_formErrors) => {
                    toast.error("Please fix the errors in the form.");
                    throw new Error("Form validation failed");
                }
            )();

            await handleMembersSubmit(
                (data) => {
                    membersData = data.members.map(member => ({
                        user_id: member.user_id ?? '',
                        db_id: member.db_id,
                    }));
                },
                (_formErrors) => {
                    toast.error("Please fix the errors in the members table.");
                    throw new Error("Members table validation failed");
                }
            )();

            if (!teamData) throw new Error("Team data is undefined");
            if (!membersData) throw new Error("Members data is undefined");

            setIsLoading(true);

            const payload = {
                id: safeNumber(id),
                ...teamData,
                buyer_id: safeNumber(teamData.buyer_id),
                members: membersData,
            };

            await updateTeamMutation.mutateAsync(payload);
        }
        catch (err) {
            const parsedError = parseTRPCError(err);
            setError(parsedError);
            toast.error(`Failed to update Team: ${parsedError}`);
        }
        finally {
            setIsLoading(false);
        }

    };

    const memberDeleteMutation = api.teams.deleteTeamMember.useMutation({
        onSuccess: async () => {
            await utils.teams.getTeamById.invalidate({ id: safeNumber(id) });
            toast.success("Team member deleted successfully!");
            setError(null);
        },
    });

    const removeMembersRow = async (index: number) => {
        removeMembers(index);

        if(!!membersFields[index]?.db_id) {
            try {
                await memberDeleteMutation.mutateAsync({ id: safeNumber(membersFields[index].db_id) });
            }
            catch (error) {
                const parsedError = parseTRPCError(error);
                toast.error(`Failed to delete team member: ${parsedError}`)
            }
        }
    }

    return (    
        <>  
            <Wrapper heading={"Update Team"} >
                <Form fields={formFields}
                    buttonLabel="Update Team"
                    register={methods.register}
                    isLoading={isLoading || isLoadingTeam}
                    validationError={validationError}
                    error={error}
                    disabled={!can_update}
                    control={control}
                />
                <TableForm 
                    title={"Team Members"}
                    name="members"
                    isLoading={isLoading || isLoadingTeam}
                    columns={membersTableFormColumns}
                    fields={membersTableFormFields}
                    rows={membersFields}
                    addRow={membersAddRow}
                    removeRow={removeMembersRow}
                    register={membersRegister}
                    validationError={membersTableValidationError?.members 
                        ? { members: membersTableValidationError.members as unknown as string } 
                        : undefined}
                    disabled={!can_update}
                    control={membersControl}
                />
                {can_update && (
                    <div className="w-full flex flex-row justify-end">
                        <Button type="button" 
                            onClick={() => submitAll()}
                            label={"Update Team"} 
                            className="text-lg tracking-wide m-8 max-w-80"
                            disabled={isLoading || !can_update}
                        />
                    </div>
                )}
            </Wrapper>  
        </>
    );
}

export default EditTeamPage;




            

            