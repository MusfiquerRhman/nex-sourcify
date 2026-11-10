import { Image, Text, View } from "@react-pdf/renderer";
import { sampleChecklistLabelOptions, sampleChecklistSections, type SampleChecklistImage } from "~/utils/sampleChecklist";
import { wrapPDFText } from "../../pp_meeting/pdfStyles";
import { additionalPhotoBounds, checklistStyles, photoGap, regularPhotoBounds } from "../pdfStyles";
import { fitPDFImage, groupPDFImages } from "../imageLayout";
import type { SampleChecklistPDFData, SampleChecklistPDFImages } from "../types";

type ChecklistSectionsProps = { data: SampleChecklistPDFData; images: SampleChecklistPDFImages };
type ChecklistPhotosProps = { rows: ReturnType<typeof getChecklistPhotoRows> };
type LabelChecksProps = { data: SampleChecklistPDFData };

const getChecklistPhotoRows = (photos: SampleChecklistImage[], images: SampleChecklistPDFImages) => {
    return groupPDFImages(
        photos.map((photo) => {
            const image = images[photo.id];
            if (!image) throw new Error("Checklist photo data is missing.");
            return { id: photo.id, src: image.src, ...fitPDFImage(image, regularPhotoBounds) };
        }),
        regularPhotoBounds.width,
        photoGap,
    );
};

const formatLabelStatus = (value: number | null) => {
    return sampleChecklistLabelOptions.find((option) => option.value === value)?.label ?? "-";
};

const LabelChecks = (props: LabelChecksProps) => {
    const { data } = props;
    const labels = [
        { name: "Main Label", status: data.main_label, position: data.main_label_position },
        { name: "Size Label", status: data.size_label, position: data.size_label_position },
        { name: "Care Label", status: data.care_label, position: data.care_label_position },
    ];

    return (
        <View style={checklistStyles.labelChecks} wrap={false}>
            <View style={checklistStyles.labelColumn}>
                {labels.map((label) => (
                    <Text key={label.name} style={checklistStyles.labelText}>
                        {`${label.name.toUpperCase()}: ${formatLabelStatus(label.status)}`}
                    </Text>
                ))}
            </View>
            <View style={[checklistStyles.labelColumn, checklistStyles.labelPositions]}>
                {labels.map((label) => (
                    <Text key={label.name} style={checklistStyles.labelText}>
                        {`POSITION: ${formatLabelStatus(label.position)}`}
                    </Text>
                ))}
            </View>
        </View>
    );
};

const ChecklistPhotos = (props: ChecklistPhotosProps) => {
    const { rows } = props;

    if (!rows.length) return null;

    return (
        <View style={checklistStyles.photoRows}>
            {rows.map((row, index) => (
                <View key={index} style={[checklistStyles.photoRow, { height: Math.max(...row.map((image) => image.height)) }]} wrap={false}>
                    {row.map((image) => (
                        // eslint-disable-next-line jsx-a11y/alt-text
                        <Image key={image.id} src={image.src} style={[checklistStyles.photo, { width: image.width, height: image.height }]} />
                    ))}
                </View>
            ))}
        </View>
    );
};

const ChecklistSections = (props: ChecklistSectionsProps) => {
    const { data, images } = props;

    return sampleChecklistSections.map((section) => {
        if (section.name === "other") {
            if (!data[section.relation].length) return null;

            return (
                <View key={section.name} style={checklistStyles.additionalPhotos}>
                    {data[section.relation].map((photo) => {
                        const image = images[photo.id];
                        if (!image) throw new Error("Checklist photo data is missing.");
                        const size = fitPDFImage(image, additionalPhotoBounds);

                        return (
                            <View key={photo.id} style={[checklistStyles.additionalPhotoFrame, size]} wrap={false}>
                                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                                <Image src={image.src} style={[checklistStyles.additionalPhoto, size]} />
                            </View>
                        );
                    })}
                </View>
            );
        }

        const comment = section.name !== "labels" ? (data[section.name] ?? "").trim() : "";
        const hasLongComment = comment.length > 1000 || comment.split(/\r?\n/).length > 12;
        const photoRows = getChecklistPhotoRows(data[section.relation], images);

        return (
            <View key={section.name} style={checklistStyles.section} wrap={hasLongComment || photoRows.length > 1}>
                <View style={checklistStyles.sectionBody} wrap={hasLongComment}>
                    <Text style={checklistStyles.sectionTitle} minPresenceAhead={40}>
                        {section.label}
                    </Text>
                    {section.name === "labels" ? (
                        <LabelChecks data={data} />
                    ) : (
                        <Text style={checklistStyles.comment} orphans={2} widows={2}>
                            {wrapPDFText(comment || "-", 60)}
                        </Text>
                    )}
                    <ChecklistPhotos rows={photoRows.slice(0, 1)} />
                </View>
                <ChecklistPhotos rows={photoRows.slice(1)} />
            </View>
        );
    });
};

export default ChecklistSections;
