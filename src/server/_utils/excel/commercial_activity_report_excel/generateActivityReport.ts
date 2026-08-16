import ExcelJS from "exceljs";
import { generatePoWiseDataWorkSheet } from "./worksheets/poWiseDataWorkSheet";
import { generateFactoryPaymentWorkSheet } from "./worksheets/factoryPaymentWorkSheet";
import { generateCiAndRealizationWorkSheet } from "./worksheets/CIandRealizationWorkSheet";
import type { CiAndRealizationData, FactoryInvoiceData, PoWiseData } from "~/server/api/routers/reports/_types/commercialActivityReport";

export interface ActivityReportMeta {
    fromDate: string;
    toDate: string;
    generatedBy: string;
}

interface ActivityReportProps {
    poWiseData: PoWiseData[];
    ciAndRealizationData: CiAndRealizationData[];
    factoryInvoiceData: FactoryInvoiceData[];
    reportMeta: ActivityReportMeta
}

export const generateActivityReportExcel = async (props: ActivityReportProps) => {
    const { poWiseData, ciAndRealizationData, factoryInvoiceData, reportMeta } = props;

    const workbook = new ExcelJS.Workbook();

    // Set file metadata
    workbook.creator = reportMeta.generatedBy; 
    workbook.created = new Date();
    workbook.company = "Renaissance Designs Limited";
    workbook.subject = "Post-Exfactory Commercial Activity Report";
    workbook.title = "Post-Exfactory Commercial Activity Report";
    workbook.category = "Commercial Reports";
    workbook.manager = "Nexus ERP";

    generatePoWiseDataWorkSheet({workbook, poWiseData, reportMeta});

    generateCiAndRealizationWorkSheet({workbook, ciAndRealizationData, reportMeta});

    generateFactoryPaymentWorkSheet({workbook, factoryInvoiceData, reportMeta});

    return await workbook.xlsx.writeBuffer();
}