'use client';

import { Button, Form, Wrapper } from "~/components";
import React, { useState } from "react";
import { useCompaniesForm } from "../config/useCompaniesForm";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import TableForm from "~/components/organisms/table/TableForm";

import { type FormValues as BankFormValues } from "../bankConfig/tableFormSchema";
import { useCompanyBanksForm } from "../bankConfig/useCompanyBanksForm";
import { tableFormColumns } from "../bankConfig/tableFormColumns";
import type { FormValues } from "../config/formSchema";

const NewCompanyPage = () => {
    // Form setup
    const { methods, handleSubmit, formFields, validationError, control, reset } = useCompaniesForm();
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
    } = useCompanyBanksForm();

    // TRPC utils
    const utils = api.useUtils();

    const addCompany = api.companies.addCompany.useMutation({
        onSuccess: async () => {
            toast.success("Company added successfully!");
            await utils.companies.getCompanies.invalidate();
            setError(null);
            resetBanksForm();
            reset();
        },
    });

    const removeRow = (index: number) => {
        remove(index);
    }

    // Handle form submission for all fields
    const onSubmitAll =  async () => {
        try {
            const companyData = await new Promise<FormValues>((resolve) => {
                void handleSubmit((data) => resolve(data))();
            });

            const bankData = await new Promise<BankFormValues[]>((resolve) => {
                void handleBanksSubmit((data) => resolve(data.banks))();
            });

            const payload = {
                ...companyData,
                currency_id: Number(companyData.currencies_id),
                country_id: Number(companyData.country_id),
                company_banks: bankData.map(bank => ({
                    bank_id: Number(bank.bank_id),
                    branch_name: bank.branch_name,
                    account_no: bank.account_no,
                    account_name: bank.account_name,
                    swift: bank.swift,
                    address: bank.address,
                })),
            };

            await addCompany.mutateAsync(payload);
        } 
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error adding company: ${message}`);
            setError(message);
        }
        finally {
            setIsLoading(false);
        }
    };

    return (
        <Wrapper heading='Add Company' >
            <Form fields={formFields} 
                buttonLabel="Add New Company" 
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError}
                error={error}
                control={control}
            />
            <TableForm 
                title={"Company Banks"}
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
}


export default NewCompanyPage;