import type { JsonValue } from "@prisma/client/runtime/client";
import React from "react";
import { formatDateTime } from "~/utils/localDateString";
import { InfoRow } from "./InfoRow";
import { Section } from "./Section";

interface ErrorLog {
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

type ErrorCardProps = {
    error: ErrorLog;
};

const errorCodes: Record<string, string> = {
    'P2000': 'COLUMN VALUE TOO LONG',
    'P2002': 'UNIQUE CONSTRAINT VIOLATION',
    'P2003': 'FOREIGN KEY CONSTRAINT VIOLATION',
    'P2006': 'PROVIDED VALUE IS NOT VALID',
    'P2004': 'CONSTRAINT VALIDATION FAILED',
    'P2011': 'NULL CONSTRAINT VIOLATION',
    'P2012': 'MISSING REQUIRED VALUE',
    'P2014': 'RELATION VIOLATION',
    'P2020': 'VALUE OUT OF RANGE',
    'P2025': 'NOT_FOUND',
    'P2028': 'TRANSACTION ERROR',
    'P1010': 'FORBIDDEN',
    'P1008': 'TIMED OUT',
    'P2010': 'RAW QUERY FAILED',
    'UnknownCode': 'UNKNOWN ERROR CODE'
}

export default function ErrorCard({ error }: ErrorCardProps) {
    return (
        <div className="overflow-hidden rounded-xl border border-red-200 bg-white shadow mb-4 m-2">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-red-200 bg-red-50 px-6 py-4">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-2xl">
                        ⁉️
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold text-red-700">
                            {error.error_name}
                        </h2>

                        <div className="mt-1 flex items-center gap-2">
                            <span className="rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                                {error.request_method}
                            </span>

                            <span className="rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                                {error.error_code}
                            </span>

                            <span className="rounded bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-700">
                                {error.error_code ? errorCodes[error.error_code] : "UNKNOWN"}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-2 text-right p-2">
                    <span className="text-sm text-rose-700/60 uppercase">
                        {formatDateTime(new Date(error.created_at))}
                    </span>
                </div>
            </div>

            {/* Explanation */}
            <Section title="Error Message">
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2">
                    <p className="text-sm text-amber-800">
                        {error.error_message?.trim()}
                    </p>
                </div>
            </Section>

            {/* Details */}
            <div className="grid gap-6 p-6 md:grid-cols-2 border-b border-gray-200">
                <InfoRow label="Procedure" value={error.procedure_name} code />
                <InfoRow label="Referer" value={error.referer} code />
                <InfoRow label="User" value={error.full_name} />
                <InfoRow label="User ID" value={error.user_id} />
                <InfoRow label="IP Address" value={error.ip_address} />
                <InfoRow label="User Agent" value={error.user_agent} />
                <InfoRow label="Request ID" value={error.request_id} />
            </div>

            {/* Input Data */}
            <Section title="user Input">
                <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-green-400">
                    {JSON.stringify(error.input_data, null, 2)}
                </pre>
            </Section>
        </div>
    );
}



