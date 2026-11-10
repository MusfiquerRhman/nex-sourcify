import JSZip from "jszip";
import type ExcelJS from "exceljs";
import { TABLE_HEADER_ROW } from "../../config";
import { createChartXml, createDrawingXml, createMonthAxisXml, RELATIONSHIP_NAMESPACE, XML_HEADER, type ChartDefinition } from "./cashflowChartXml";

const PACKAGE_RELATIONSHIP_NAMESPACE = "http://schemas.openxmlformats.org/package/2006/relationships";

const chartDefinitions: ChartDefinition[] = [
    { sheet: "Monthly CF", title: "MONTH-WISE CASH-FLOW", valueColumn: "B", grouped: false, millions: false },
    { sheet: "Monthly Weekly CF", title: "MONTH-WISE WEEK-WISE CASH-FLOW", valueColumn: "C", grouped: true, millions: false },
    { sheet: "Weekly CF", title: "WEEK-WISE CASH-FLOW", valueColumn: "B", grouped: false, millions: true },
    { sheet: "Aging", title: "AGING STATUS", valueColumn: "B", grouped: false, millions: false },
];

// ExcelJS does not expose chart authoring; attach native OOXML charts after its export.
export const addCashflowCharts = async (workbook: ExcelJS.Workbook, buffer: ExcelJS.Buffer) => {
    const zip = await JSZip.loadAsync(buffer);
    const contentTypesFile = zip.file("[Content_Types].xml");

    if (!contentTypesFile) throw new Error("Cashflow workbook content types are missing.");

    let contentTypes = await contentTypesFile.async("string");

    for (const [index, definition] of chartDefinitions.entries()) {
        const worksheet = workbook.getWorksheet(definition.sheet);

        if (!worksheet) throw new Error(`Cashflow worksheet ${definition.sheet} is missing.`);

        const chartId = index + 1;
        const sheetId = workbook.worksheets.indexOf(worksheet) + 1;
        const sheetPath = `xl/worksheets/sheet${sheetId}.xml`;
        const sheetFile = zip.file(sheetPath);

        if (!sheetFile) throw new Error(`Cashflow worksheet XML ${definition.sheet} is missing.`);

        const sheetXml = await sheetFile.async("string");

        zip.file(sheetPath, sheetXml.replace("</worksheet>", 
            /*xml*/`<drawing xmlns:r="${RELATIONSHIP_NAMESPACE}" r:id="rIdCashflowChart"/></worksheet>`
        ));

        zip.file(`xl/worksheets/_rels/sheet${sheetId}.xml.rels`, /*xml*/`${XML_HEADER}
            <Relationships xmlns="${PACKAGE_RELATIONSHIP_NAMESPACE}">
                <Relationship 
                    Id="rIdCashflowChart" 
                    Type="${RELATIONSHIP_NAMESPACE}/drawing" 
                    Target="../drawings/drawing${chartId}.xml"
                />
            </Relationships>`);

        zip.file(`xl/drawings/drawing${chartId}.xml`, 
            createDrawingXml(chartId, definition, worksheet.rowCount - TABLE_HEADER_ROW - 1)
        );

        zip.file(`xl/drawings/_rels/drawing${chartId}.xml.rels`, /*xml*/`${XML_HEADER}
            <Relationships xmlns="${PACKAGE_RELATIONSHIP_NAMESPACE}">
                <Relationship 
                    Id="rId1" 
                    Type="${RELATIONSHIP_NAMESPACE}/chart" 
                    Target="../charts/chart${chartId}.xml"
                />
            </Relationships>`);
            
        zip.file(`xl/charts/chart${chartId}.xml`, createChartXml(worksheet, definition));

        const monthAxis = definition.grouped ? createMonthAxisXml(worksheet) : null;
        if (monthAxis) {
            zip.file(`xl/drawings/monthAxis${chartId}.xml`, monthAxis);

            zip.file(`xl/charts/_rels/chart${chartId}.xml.rels`, /*xml*/`${XML_HEADER}
                <Relationships xmlns="${PACKAGE_RELATIONSHIP_NAMESPACE}">
                    <Relationship 
                        Id="rIdMonthAxis" 
                        Type="${RELATIONSHIP_NAMESPACE}/chartUserShapes" 
                        Target="../drawings/monthAxis${chartId}.xml"
                    />
                </Relationships>`);
            contentTypes = contentTypes.replace("</Types>", /*xml*/`
                <Override PartName="/xl/drawings/monthAxis${chartId}.xml" 
                    ContentType="application/vnd.openxmlformats-officedocument.drawingml.chartshapes+xml"
                />
                </Types>`
            );
        }

        contentTypes = contentTypes.replace("</Types>", /*xml*/`
            <Override PartName="/xl/charts/chart${chartId}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>
            <Override PartName="/xl/drawings/drawing${chartId}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>
        </Types>`);
    }

    zip.file("[Content_Types].xml", contentTypes);
    return await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
};
