"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller } from "react-hook-form";
import { toast } from "sonner";
import { printingWhiteIcon } from "~/assets";
import { Button, FormSelect, TextField, Wrapper } from "~/components";
import { useDecodedUser, useModulePermissions } from "~/hooks";
import { api } from "~/trpc/react";
import { parseTRPCError } from "~/utils/parseTRPCError";
import { sampleChecklistLabelFields, sampleChecklistLabelOptions, sampleChecklistSections } from "~/utils/sampleChecklist";
import type { SampleChecklistFormValues } from "../config/formSchema";
import { getSampleChecklistHeader, useSampleChecklistForm, type SampleChecklist } from "../config/useSampleChecklistForm";
import PhotoSection from "./PhotoSection";

type SampleChecklistEditorProps = { checklist?: SampleChecklist };

const SampleChecklistEditor = (props: SampleChecklistEditorProps) => {
    const { checklist } = props;

    const router = useRouter();
    const utils = api.useUtils();
    const { can_add, can_update, can_view } = useModulePermissions();
    const { user } = useDecodedUser();
    const [isResubmission, setIsResubmission] = useState(false);
    const [previousSubmissionId, setPreviousSubmissionId] = useState<string | null>(null);
    const isFirstSubmission = !checklist && !isResubmission;
    const { methods, headerFields, resetDependentFields, queryError, isLoadingOptions, selectedStyle, canChangeStyle, sampleTypes } = useSampleChecklistForm(checklist, isFirstSubmission);
    const referencesQuery = api.sampleChecklist.getResubmissionReferences.useQuery(undefined, {
        enabled: !checklist && isResubmission && !!can_add && !!can_view,
    });
    const [error, setError] = useState<string | null>(null);
    const addChecklist = api.sampleChecklist.addSampleCheckList.useMutation({
        onError: (error, values) => {
            if (values.with_order && !values.is_resubmission && error.data?.code === "CONFLICT") {
                void utils.sampleChecklist.invalidate();
            }
        },
    });
    const updateChecklist = api.sampleChecklist.updateSampleChecklist.useMutation();
    const {
        control,
        register,
        formState: { errors, isSubmitting },
    } = methods;
    const canSave = checklist ? !!can_update : !!can_add;
    const isMutationPending = addChecklist.isPending || updateChecklist.isPending;
    const isSaving = isSubmitting || isMutationPending;
    const needsReference = !checklist && isResubmission && !previousSubmissionId;
    const disabled = !canSave || isSaving || needsReference;
    const errorMessage = (isResubmission ? referencesQuery.error?.message : undefined) ?? queryError?.message ?? error;

    const isHeaderLocked = (name: keyof SampleChecklistFormValues) => {
        if (!checklist || name === "with_order" || name === "sample_quantity" || name === "status") return false;
        if (name === "style_id" || name === "style_no_manual") return !canChangeStyle;
        return true;
    };

    const selectPreviousSubmission = (id: string | null) => {
        const source = referencesQuery.data?.find((reference) => reference.id === id);
        if (id && !source) return;

        setPreviousSubmissionId(id);
        setError(null);
        methods.reset({ ...methods.getValues(), ...getSampleChecklistHeader(source) });
    };

    const onSubmit = methods.handleSubmit(async (values) => {
        if (!canSave || isMutationPending || needsReference) return;
        if ((canChangeStyle && values.with_order && !selectedStyle) || isLoadingOptions || queryError) {
            setError("Select an available buyer, factory, and style before saving the checklist.");
            return;
        }
        setError(null);
        if (isFirstSubmission && values.with_order && !sampleTypes?.some((sampleType) => sampleType.id === values.sample_type)) {
            methods.setError("sample_type", { message: "Select an available sample type for this style." });
            return;
        }

        try {
            const id = checklist
                ? await updateChecklist.mutateAsync({ ...values, id: checklist.id })
                : await addChecklist.mutateAsync(isResubmission && previousSubmissionId
                    ? { ...values, is_resubmission: true, previous_submission_id: previousSubmissionId }
                    : { ...values, is_resubmission: false });
            toast.success(`Sample Checklist ${checklist ? "updated" : "added"} successfully!`);
            methods.reset(values);
            void utils.sampleChecklist.invalidate();
            if (!checklist) router.push(`/quality/sample_checklist/edit/${id}`);
        } catch (error) {
            const message = parseTRPCError(error);
            setError(message);
            toast.error(`Failed to save Sample Checklist: ${message}`);
        }
    });

    return (
        <Wrapper
            heading={checklist ? (canSave ? "Update Sample Checklist" : "View Sample Checklist") : "Add Sample Checklist"}
            subSectionRight={
                checklist && can_view ? (
                    <div className="mb-3 w-50">
                        <Button
                            variant="secondary"
                            label="Print Report"
                            leftIcon={printingWhiteIcon}
                            disabled={isSaving}
                            onClick={() => window.open(`/pdf/sample_checklist/${checklist.id}`, "_blank")}
                        />
                    </div>
                ) : null
            }
        >
            <form onSubmit={onSubmit} className="flex w-full flex-col gap-6 p-4 md:p-8">
                {errorMessage && (
                    <p role="alert" className="rounded border border-red-400 bg-red-100 p-4 text-red-700">
                        {errorMessage}
                    </p>
                )}

                <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <TextField
                        name="sample_ref_no"
                        label="Reference No"
                        value={checklist?.sample_ref_no ?? ""}
                        placeholder="Generated on save"
                        disabled
                        optional
                    />
                    <TextField
                        name="submission_no"
                        label="Submission No"
                        value={checklist?.submission_no ?? (isResubmission ? "" : 1)}
                        placeholder="Assigned on save"
                        disabled
                        optional
                    />
                    {checklist ? (
                        <TextField
                            name="is_resubmission"
                            label="Submission"
                            value={checklist.is_resubmission ? "Resubmission" : "First Submission"}
                            readOnly
                            optional
                        />
                    ) : (
                        <FormSelect
                            name="is_resubmission"
                            label="Submission"
                            value={isResubmission}
                            options={[
                                { label: "First Submission", value: false },
                                ...(can_view ? [{ label: "Resubmission", value: true }] : []),
                            ]}
                            onChange={(value) => {
                                setIsResubmission(value === true);
                                setError(null);
                                if (previousSubmissionId) selectPreviousSubmission(null);
                            }}
                            disabled={!canSave || isSaving}
                        />
                    )}
                    {!checklist && isResubmission && (
                        <FormSelect
                            name="previous_submission_id"
                            label="Previous Reference No"
                            value={previousSubmissionId}
                            options={referencesQuery.data?.map((reference) => ({ label: reference.sample_ref_no, value: reference.id }))}
                            onChange={(value) => {
                                if (typeof value === "string" && value !== previousSubmissionId) selectPreviousSubmission(value);
                            }}
                            disabled={!canSave || isSaving || referencesQuery.isPending}
                        />
                    )}
                    {headerFields.map((header) =>
                        header.type === "select" ? (
                            <Controller
                                key={header.name}
                                name={header.name}
                                control={control}
                                render={({ field }) => (
                                    <FormSelect
                                        name={header.name}
                                        label={header.label}
                                        options={header.options}
                                        value={field.value}
                                        onChange={(value) => {
                                            if (value === field.value) return;
                                            field.onChange(value ?? (header.name === "status" ? Number.NaN : typeof field.value === "boolean" ? true : typeof field.value === "number" ? 0 : ""));
                                            resetDependentFields(header.name);
                                        }}
                                        error={errors[header.name]?.message}
                                        optional={header.optional}
                                        disabled={disabled || header.disabled || isHeaderLocked(header.name)}
                                    />
                                )}
                            />
                        ) : header.name === "sample_quantity" ? (
                            <Controller
                                key={header.name}
                                name="sample_quantity"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label={header.label}
                                        type="number"
                                        min={0}
                                        max={2147483647}
                                        step={1}
                                        value={Number.isFinite(field.value) ? field.value : ""}
                                        onChange={(event) => field.onChange(event.target.valueAsNumber)}
                                        error={errors.sample_quantity?.message}
                                        required
                                        disabled={disabled}
                                    />
                                )}
                            />
                        ) : (
                            <TextField
                                key={header.name}
                                {...register(header.name)}
                                label={header.label}
                                type={header.type}
                                error={errors[header.name]?.message}
                                disabled={disabled || isHeaderLocked(header.name)}
                            />
                        ),
                    )}
                    <TextField name="checked_by" label="Checked By" value={user?.user_id ?? ""} readOnly optional />
                </div>

                {sampleChecklistSections
                    .filter((section) => !!checklist || section.name !== "other")
                    .map((section) => (
                        <section key={section.name} className="rounded-md border border-dashed border-gray-400 p-4 shadow-sm">
                            <h3 className="mb-3 text-xl font-semibold text-gray-700">{section.label}</h3>
                            {section.name === "labels" ? (
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {sampleChecklistLabelFields.map((label) => (
                                        <Controller
                                            key={label.name}
                                            name={label.name}
                                            control={control}
                                            render={({ field }) => (
                                                <FormSelect
                                                    name={label.name}
                                                    label={label.label}
                                                    value={field.value}
                                                    options={sampleChecklistLabelOptions}
                                                    onChange={(value) => field.onChange(value ?? 0)}
                                                    error={errors[label.name]?.message}
                                                    disabled={disabled}
                                                />
                                            )}
                                        />
                                    ))}
                                </div>
                            ) : section.name !== "other" ? (
                                <>
                                    <label htmlFor={section.name} className="mb-2 block text-sm text-gray-600">
                                        {section.label} Comments
                                    </label>
                                    <textarea
                                        id={section.name}
                                        {...register(section.name)}
                                        rows={4}
                                        disabled={disabled}
                                        className="focus:border-secondary w-full resize-y rounded-md border border-gray-300 p-3 text-sm outline-none disabled:bg-gray-100"
                                        placeholder={`Enter ${section.label.toLowerCase()} comments`}
                                    />
                                    {errors[section.name] && (
                                        <p role="alert" className="text-sm text-red-600">
                                            {errors[section.name]?.message}
                                        </p>
                                    )}
                                </>
                            ) : null}
                            {checklist && (
                                <PhotoSection
                                    checklistId={checklist.id}
                                    section={section.name}
                                    title={section.label}
                                    images={checklist[section.relation]}
                                    disabled={disabled}
                                />
                            )}
                        </section>
                    ))}

                {canSave && (
                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            label={isSaving ? "Saving..." : checklist ? "Save Sample Checklist" : "Create Sample Checklist"}
                            disabled={disabled || isLoadingOptions || !!queryError}
                            className="max-w-80"
                        />
                    </div>
                )}
            </form>
        </Wrapper>
    );
};

export default SampleChecklistEditor;
