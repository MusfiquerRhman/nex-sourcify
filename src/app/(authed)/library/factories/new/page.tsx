'use client';

import { Button, Form, Wrapper } from "~/components";
import React, { useState } from "react";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useFactoriesForm } from "../config/useFactories";
import TableForm from "~/components/organisms/table/TableForm";
import { type FormValues } from "../config/formSchema";
import { type FormValues as BankFormValues } from "../bankConfig/tableFormSchema";
import { useFactoryBanksForm } from "../bankConfig/useFactoryBanksForm";
import { tableFormColumns } from "../bankConfig/tableFormColumns";

const NewFactoryPage = () => {
    // Form setup
    const { methods, handleSubmit, formFields, validationError, reset } = useFactoriesForm();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { 
        register,
        handleSubmit: handleBanksSubmit,
        tableFormFields,
        fields,
        addRow,
        remove,
        validationError: tableValidationError,
        control: bankControl,
        reset: resetBanksForm
    } = useFactoryBanksForm();

    // TRPC utils
    const utils = api.useUtils();

    const addFactory = api.factory.addFactory.useMutation({
        onSuccess: async () => {
            toast.success("Factory added successfully!");
            await utils.factory.getFactories.invalidate();
            setError(null);
            reset();
            resetBanksForm();
        },
    });

    // Handle form submission for all fields
    const onSubmitAll =  async () => {
        try {
            const factoryData = await new Promise<FormValues>((resolve) => {
                void handleSubmit((data) => resolve(data))();
            });

            const bankData = await new Promise<BankFormValues[]>((resolve) => {
                void handleBanksSubmit((data) => resolve(data.banks))();
            });

            const payload = {
                ...factoryData,
                factory_banks: bankData.map(bank => ({
                    bank_id: Number(bank.bank_id),
                    branch_name: bank.branch_name,
                    account_no: bank.account_no,
                    account_name: bank.account_name,
                    swift_code: bank.swift_code,
                    address: bank.address,
                })),
            };

            await addFactory.mutateAsync(payload);
        } 
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Failed to add Factory: ${message}`);
            setError(message);
        }
        finally {
            setIsLoading(false);
        }
    };

    const removeRow = (index: number) => {
        remove(index);
    }

    return (
        <Wrapper heading='Add Factory' >
            <Form fields={formFields} 
                buttonLabel="Add New Factory" 
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError}
                error={error}
            />
            <TableForm 
                title={"Factory Banks"}
                name='banks'
                fields={tableFormFields}
                rows={fields}
                columns={tableFormColumns}
                register={register}
                addRow={addRow}
                removeRow={removeRow}
                validationError={tableValidationError.banks}
                control={bankControl}
            />
            <div className="w-full flex flex-row justify-end">
                <Button type="button" 
                    onClick={() => onSubmitAll()}
                    label={"Submit"} 
                    className="text-lg tracking-wide mt-6 max-w-80 m-8"
                    disabled={isLoading}
                />
            </div>
        </Wrapper>
    );
};

export default NewFactoryPage;