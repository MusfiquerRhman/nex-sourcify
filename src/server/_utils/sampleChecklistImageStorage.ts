import path from "node:path";
import { sampleChecklistImageSchema, sampleChecklistImageSectionSchema, type SampleChecklistImageSection } from "../../utils/sampleChecklist";

export const getSampleChecklistImageDirectory = (section: SampleChecklistImageSection) => {
    return path.join(process.cwd(), "public", "sample_checklist", sampleChecklistImageSectionSchema.parse(section));
};

export const getSampleChecklistImagePath = (section: SampleChecklistImageSection, imageId: string) => {
    return path.join(getSampleChecklistImageDirectory(section), `${sampleChecklistImageSchema.shape.id.parse(imageId)}.jpg`);
};
