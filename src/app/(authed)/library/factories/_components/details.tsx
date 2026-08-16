'use client';

import { Button, Form, Wrapper } from "~/components";
import React, { useState } from "react";
import { api } from "~/trpc/react";
import { toast } from 'sonner';
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useFactoriesForm } from "../config/useFactories";
import { useFactoryBanksForm } from "../bankConfig/useFactoryBanksForm";
import TableForm from "~/components/organisms/table/TableForm";
import { tableFormColumns } from "../bankConfig/tableFormColumns";
import { type FormValues } from "../config/formSchema";
import { type FormValues as BankFormValues } from "../bankConfig/tableFormSchema";
import type { ParamsProp } from "~/types/params";
import { useModulePermissions } from "~/hooks";

type FactoryDetailsPageProps = ParamsProp & {
    disabled?: boolean;
};

const FactoryDetailsPage = ({ params, disabled = false }: FactoryDetailsPageProps) => {
    const { id } = React.use(params)
    const [error, setError] = useState<string | null>(null);

    const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);

    const { data: factoryData, isLoading } = api.factory.getFactoryById.useQuery({ id: parseInt(id) });
    // Form setup
    const { methods, handleSubmit, formFields, validationError, trigger: triggerHeader } = useFactoriesForm(factoryData?.factory);
    const { 
        register,
        handleSubmit: handleBanksSubmit,
        tableFormFields,
        fields,
        addRow,
        remove,
        validationError: tableValidationError,
        trigger: triggerBanks,
        control: bankControl,
    } = useFactoryBanksForm(factoryData?.factoryBanks);

    // TRPC utils
    const utils = api.useUtils();

    const updateFactory = api.factory.updateFactory.useMutation({
        onSuccess: async () => {
            toast.success("Factory updated successfully!");
            await utils.factory.getFactories.invalidate();
            setError(null);
            await utils.factory.getFactoryById.invalidate({ id: parseInt(id) });
        },
    });

    const submitALl = async () => {
        setIsLoadingSubmit(true);

        try {
            let factoryData: FormValues;
            let bankData: BankFormValues[];

            // Trigger validation for both forms
            await triggerHeader();
            await triggerBanks();

            // Collect data from both forms
            await handleSubmit(
                (data) => {
                    factoryData = data;
                },
                (errors) => {
                    toast.error(`Please fix the validation errors before submitting. ${JSON.stringify(errors)}`);
                    throw new Error(JSON.stringify(errors));
                }
            )();

            await handleBanksSubmit(
                (data) => {
                    bankData = data.banks;
                },
                (errors) => {
                    toast.error(`Please fix the validation errors before submitting. ${JSON.stringify(errors)}`);
                    throw new Error(JSON.stringify(errors)); 
                }
            )();

            const payload = {
                id: parseInt(id),
                ...factoryData!,
                factory_banks: bankData!.map(bank => ({
                    db_id: bank.db_id,
                    bank_id: Number(bank.bank_id),
                    branch_name: bank.branch_name,
                    account_no: bank.account_no,
                    account_name: bank.account_name,
                    swift_code: bank.swift_code,
                    address: bank.address,
                })),
            };

            await updateFactory.mutateAsync(payload);
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error updating factory: ${message}`);
            setError(message);
        }
        finally {
            setIsLoadingSubmit(false);
        }
    };

    const deleteFactoryBank = api.factory.removeFactoryBank.useMutation({
        onSuccess: async () => {
            toast.success("Factory bank deleted successfully!");
            await utils.factory.getFactoryById.invalidate({ id: parseInt(id) });
            setError(null);
        },
    });

    const removeRow = async (index: number) => {
        try {
            if(!!fields[index]?.db_id){
                await deleteFactoryBank.mutateAsync({ id: fields[index].db_id });
            }
            
            remove(index);
        }
        catch( error) {
            const message = parseTRPCError(error);
            toast.error(`Error deleting factory bank: ${message}`);
            setError(message);
        }
        finally {
            setIsLoadingSubmit(false);
        }
    }

    const { can_delete } = useModulePermissions();

    return (
        <Wrapper heading="Update Factory">
            <Form fields={formFields} 
                buttonLabel="Update Factory" 
                register={methods.register} 
                validationError={validationError} 
                isLoading={isLoadingSubmit || isLoading}
                error={error}
                disabled={disabled}
            />
            <TableForm 
                name='banks'
                title={"Factory Banks"}
                fields={tableFormFields}
                rows={fields}
                columns={tableFormColumns}
                register={register}
                addRow={addRow}
                removeRow={removeRow}
                validationError={tableValidationError?.banks}
                disabled={disabled}
                control={bankControl}
                canDelete={can_delete}
            />
            <div className="w-full flex flex-row justify-end">
                <Button type="button" 
                    onClick={() => submitALl()}
                    label={"Submit"} 
                    className="text-lg tracking-wide mt-6 max-w-80 m-8"
                    disabled={isLoading}
                />
            </div>
        </Wrapper>
    );
};

export default FactoryDetailsPage;