import type { JsonValue } from "@prisma/client/runtime/client";
import ErrorCard from "./card";

interface ErrorList {
    full_name: string;
    user_id: string;
    request_id: string;
    created_at: Date;
    procedure_name: string;
    request_method: string;
    ip_address: string | null;
    user_agent: string | null;
    referer: string | null;
    input_data: JsonValue;
    error_name: string;
    error_code: string | null;
    error_message: string | null;
}

const ErrorLogs = ({errorList}: {errorList: ErrorList[]}) => {
    return (
        errorList.map((item, index) => (
            <ErrorCard key={index}
                error={item}
            />
        ))
    )
}

export default ErrorLogs;