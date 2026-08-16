import { Document, Page, Text, View } from "@react-pdf/renderer";
import { registerPdfFonts, styles } from "../components/pdfConfig";
import { PrintByAndDate, NexSourcifyLogo, ReportTitle } from "../components";
import { formatDate } from "~/utils/localDateString";
import type { inferRouterOutputs } from '@trpc/server';
import type { salesContractsRouter } from "~/server/api";
import SalesContractCommissionTable from "./components/Table";
import { useDecodedUser } from "~/hooks";

type RouterOutput = inferRouterOutputs<typeof salesContractsRouter>;

type GetPDFDataOutput = RouterOutput['getSalesContractCommissionPDFData'];

registerPdfFonts();

const SalesContractPDF = ({ data }: { data: GetPDFDataOutput }) => {
    const {user} = useDecodedUser();

    return (
        <Document
            title={data.pdfHeader?.sales_contract_no}
            author="Nex Sourcify"
            subject="Sales Contract PDF"
            keywords="Sales, Contract, PDF, Nex Sourcify, ERP"
            creator={`${user?.first_name} ${user?.last_name}`}
            producer="Nex Sourcify"
            pageMode='useOutlines'
			creationDate={new Date()}
        >
            <Page orientation="landscape" size="A4" style={styles.body}>
				<NexSourcifyLogo />
				<PrintByAndDate />
				<ReportTitle title="SALES CONTRACT COMMISSION" />

                {/* Sales Contract ref and date */}
                <View style={{marginTop: 15, marginBottom: 10}}>
                    <View style={styles.doubleColumnContainer}>
                        <Text style={{...styles.textBold, flex: 3}}>
                            SALES CONTRACT NO: {data.pdfHeader?.sales_contract_no}
                        </Text>
                        <View style={{flex: 2, display: 'flex', flexDirection: 'row'}}>
                            <Text style={styles.textBold}>SC Date:</Text>
                            <Text style={styles.textAmasis}> {" "}
                                {data.pdfHeader?.sales_contract_date 
                                    ? formatDate(new Date(data.pdfHeader.sales_contract_date)) 
                                    : ""
                                }
                            </Text>
                        </View>
                    </View>
                    <Text style={{...styles.textBold, flex: 3}}>
                        BUYER NAME: {data.pdfHeader?.buyers.buyer_name}
                    </Text>
                </View>

                {!data.hasAmendment && (
                    <SalesContractCommissionTable data={data.nonAmendData ?? []} />
                )}

                {data.hasAmendment && (
                    data.amendData?.map((amendment, index) => {
                        const shipment_details = Array.isArray(amendment.shipment_details)
                            ? ([] as any[]).concat(...amendment.shipment_details)
                            : amendment.shipment_details ?? [];

                        const row = { ...amendment, ref_no: amendment.ref_no ?? "", shipment_details };

                        return (
                            <SalesContractCommissionTable key={index} 
                                data={[row]} 
                                amendment_no={amendment.amendment_no ?? undefined} 
                                amendment_date={amendment.amendment_date} 
                            />
                        );
                    })
                )}

                <Text style={styles.pageNumber}
                    render={({ pageNumber, totalPages }) =>
                        `${pageNumber} / ${totalPages}`
                    }
                    fixed
                />
			</Page>
        </Document>
    )
}


export default SalesContractPDF;