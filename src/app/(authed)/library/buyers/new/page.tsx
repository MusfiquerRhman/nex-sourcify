'use client';

import { Button, Form, Wrapper } from "~/components";
import React, { useState } from "react";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import Brands from "../components/brands";

import { useBuyersForm } from "../config/useBuyersForm";
import TableForm from "~/components/organisms/table/TableForm";
import { type FormValues } from "../config/formSchema";

import { useConsigneeForm } from "../consigneeConfig/useConsigneeForm";
import { tableFormColumns as consigneeTableFormColumns } from "../consigneeConfig/tableFormColumns";
import { type FormValues as ConsigneeFormValues } from "../consigneeConfig/tableFormSchema";

import { useBanksForm } from "../banksConfig/useBuyerBankForm";
import { tableFormColumns as bankTableFormColumns } from "../banksConfig/tableFormColumns";
import { type FormValues as BankFormValues } from "../banksConfig/tableFormSchema";

import { useClauseForm } from "../clauseConfig/useClauseForm";
import { tableFormColumns as clauseTableFormColumns } from "../clauseConfig/tableFormColumns";
import { type FormValues as ClauseFormValues } from "../clauseConfig/tableFormSchema";

import { usePolicyForm } from "../latePolicyConfig/useLatePolicyForm";
import { tableFormColumns as latePolicyTableFormColumns } from "../latePolicyConfig/tableFormColumns";
import { type FormValues as LatePolicyFormValues } from "../latePolicyConfig/tableFormSchema";
import { type BrandsState } from "~/types/merchandising";

const NewBuyerPage = () => {
    // Form setup
    const { methods, handleSubmit, formFields, validationError, control, reset } = useBuyersForm();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [brands, setBrands] = useState<BrandsState>();

    const { 
        register: consigneeRegister,
        handleSubmit: handleConsigneeSubmit,
        tableFormFields: consigneeTableFormFields,
        fields: consigneeFields,
        addRow: consigneeAddRow,
        remove: removeConsignee,
        validationError: consigneeTableValidationError,
        reset: resetConsignee
    } = useConsigneeForm();

    const { 
        register: bankRegister,
        handleSubmit: handleBankSubmit,
        tableFormFields: bankTableFormFields,
        fields: bankFields,
        addRow: bankAddRow,
        remove: removeBank,
        validationError: bankTableValidationError,
        control: bankControl,
        reset: resetBank
    } = useBanksForm();

    const { 
        register: clauseRegister,
        handleSubmit: handleClauseSubmit,
        tableFormFields: clauseTableFormFields,
        fields: clauseFields,
        addRow: clauseAddRow,
        remove: removeClause,
        validationError: clauseTableValidationError,
        reset: resetClause
    } = useClauseForm();

    const { 
        register: latePolicyRegister,
        handleSubmit: handleLatePolicySubmit,
        tableFormFields: latePolicyTableFormFields,
        fields: latePolicyFields,
        addRow: latePolicyAddRow,
        remove: removeLatePolicy,
        validationError: latePolicyTableValidationError,
        reset: resetLatePolicy
    } = usePolicyForm();

    // TRPC utils
    const utils = api.useUtils();

    const addBuyer = api.buyers.addBuyers.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Buyer added successfully!");
            await utils.buyers.getBuyers.invalidate();
            reset();
            resetConsignee();
            resetBank();
            resetClause();
            resetLatePolicy();
            setBrands(undefined);
        },
    });
    
    const submitAll = async () => {
        try {
            const buyerData = await new Promise<FormValues>((resolve) => {
                void handleSubmit((data) => resolve(data))();
            });
    
            const consigneeData = await new Promise<ConsigneeFormValues[]>((resolve) => {
                void handleConsigneeSubmit((data) => resolve(data.consignees))();
            });

            const bankData = await new Promise<BankFormValues[]>((resolve) => {
                void handleBankSubmit((data) => resolve(data.banks))();
            });

            const clauseData = await new Promise<ClauseFormValues[]>((resolve) => {
                void handleClauseSubmit((data) => resolve(data.clause))();
            });

            const latePolicyData = await new Promise<LatePolicyFormValues[]>((resolve) => {
                void handleLatePolicySubmit((data) => resolve(data.policy))();
            });

            setIsLoading(true);
    
            const payload = {
                ...buyerData,
                country_id: buyerData.country_id ? Number(buyerData.country_id) : undefined,
                overseas_office_id: buyerData.overseas_office_id ? Number(buyerData.overseas_office_id) : undefined,
                consignee: consigneeData.map((consignee, index) => ({
                    sl_no: index + 1,
                    consignee_name: consignee.consignee_name,
                    address: consignee.address,
                })),
                banks: bankData.map((bank) => ({
                    bank_id: Number(bank.bank_id),
                    branch_name: bank.branch_name,
                    account_no: bank.account_no,
                    account_name: bank.account_name,
                    swift: bank.swift,
                    address: bank.address,
                })),
                clause: clauseData.map((clause, index) => ({
                    sl_no: index + 1,
                    description: clause.description,
                })),
                policy: latePolicyData.map((policy, index) => ({
                    sl_no: index + 1,
                    description: policy.description,
                })),
                buyer_brands: brands?.buyer_brands ?? [],
            };
    
            await addBuyer.mutateAsync(payload);
        } 
        catch(e){
            const message = parseTRPCError(error);
            toast.error(`Failed to add Buyer: ${message}`);
            setError(message);
        }finally {
            setIsLoading(false);
        }
    };

    const consigneeRemoveRow = (index: number) => {
        removeConsignee(index);
    }

    const bankRemoveRow = (index: number) => {
        removeBank(index);
    }

    const removeLatePolicyRow = (index: number) => {
        removeLatePolicy(index);
    }

    const removeClauseRow = (index: number) => {
        removeClause(index);
    }

    return (
        <Wrapper heading="Add A New Buyer">
            <Form fields={formFields} 
                buttonLabel="Add New Buyer" 
                control={control}
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError}
                error={error}
            />
            <TableForm 
                title={"Buyer Consignees"}
                name="consignees"
                isLoading={isLoading}
                fields={consigneeTableFormFields}
                rows={consigneeFields}
                columns={consigneeTableFormColumns}
                register={consigneeRegister}
                addRow={consigneeAddRow}
                removeRow={consigneeRemoveRow}
                validationError={consigneeTableValidationError.consignees}
            />
            <TableForm 
                title={"Buyer Banks"}
                name="banks"
                isLoading={isLoading}
                fields={bankTableFormFields}
                rows={bankFields}
                columns={bankTableFormColumns}
                register={bankRegister}
                addRow={bankAddRow}
                removeRow={bankRemoveRow}
                validationError={bankTableValidationError.banks}
                control={bankControl}
            />
            <TableForm 
                title={"Buyer Additional Clauses"}
                name="clause"
                isLoading={isLoading}
                fields={clauseTableFormFields}
                rows={clauseFields}
                columns={clauseTableFormColumns}
                register={clauseRegister}
                addRow={clauseAddRow}
                removeRow={removeClauseRow}
                validationError={clauseTableValidationError.clause}
            />
            <TableForm 
                title={"Buyer Late Delivery Policies"}
                name="policy"
                isLoading={isLoading}
                fields={latePolicyTableFormFields}
                rows={latePolicyFields}
                columns={latePolicyTableFormColumns}
                register={latePolicyRegister}
                addRow={latePolicyAddRow}
                removeRow={removeLatePolicyRow}
                validationError={latePolicyTableValidationError.policy}
            />
            <Brands brands={brands} setBrands={setBrands}/>
            <div className="w-full flex flex-row justify-end">
                <Button type="button" 
                    onClick={() => submitAll()}
                    label={"Add New Buyer"} 
                    className="text-lg tracking-wide m-8 max-w-80"
                    disabled={isLoading}
                />
            </div>
        </Wrapper>
    );
}

export default NewBuyerPage;