import type { RouterOutputs } from "~/trpc/react";
import type { PDFImageSize } from "./imageLayout";

export type SampleChecklistPDFData = RouterOutputs["sampleChecklist"]["getSampleChecklistById"];
export type SampleChecklistPDFImage = PDFImageSize & { src: string };
export type SampleChecklistPDFImages = Record<string, SampleChecklistPDFImage>;
