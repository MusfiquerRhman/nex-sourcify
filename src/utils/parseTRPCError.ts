export const parseTRPCError = (error: any): string => {
    // Zod validation errors
    const zodIssues = error?.data?.zodError?.issues;
    if (Array.isArray(zodIssues) && zodIssues.length > 0) {
        return zodIssues[0].message || "Invalid input";
    }

    // FieldErrors structure
    const fieldErrors = error?.data?.zodError?.fieldErrors;
    if (fieldErrors) {
        const first = Object.values(fieldErrors).flat()[0];
        if (first) return String(first);
    }

    // Fallback to message
    const rawMessage = error?.message || "Something went wrong";
    
    // Only keep the part after the last colon
    const parts = rawMessage.split(":");
    return parts[parts.length - 1].trim();
};
