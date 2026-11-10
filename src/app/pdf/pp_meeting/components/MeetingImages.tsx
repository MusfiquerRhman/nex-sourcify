import { Image, Text, View } from "@react-pdf/renderer";
import { pdfStyles } from "../pdfStyles";
import type { PPMeetingPDFData } from "../types";

type Props = {
    data: PPMeetingPDFData;
};

export const MeetingImages = (props: Props) => {
    const { data } = props;
    const rowCount = Math.max(Math.ceil(data.ppsImages.length / 2), Math.ceil(data.sizeSetImages.length / 2), 1);

    const renderPhotoRow = (index: number) => (
        <View key={index} style={pdfStyles.photoRow} wrap={false}>
            {[
                { label: 'PPS view Front/back', images: data.ppsImages.slice(index * 2, index * 2 + 2) },
                { label: 'Size Set view Front/back', images: data.sizeSetImages.slice(index * 2, index * 2 + 2) },
            ].map((group) => (
                <View key={group.label} style={pdfStyles.photoColumn}>
                    <Text style={pdfStyles.photoCaption}>{group.label}</Text>
                    <View style={pdfStyles.photoGrid}>
                        {group.images.length ? Array.from({ length: 2 }, (_, imageIndex) => {
                            const photo = group.images[imageIndex];

                            return (
                                <View key={photo?.id ?? imageIndex} style={pdfStyles.photoSlot}>
                                    {photo && (
                                        // eslint-disable-next-line jsx-a11y/alt-text
                                        <Image src={photo.url} style={pdfStyles.photo} />
                                    )}
                                </View>
                            );
                        }) : <Text style={pdfStyles.emptyPhoto}>{index === 0 ? 'No images uploaded.' : ''}</Text>}
                    </View>
                </View>
            ))}
        </View>
    );

    return (
        <View>
            <View wrap={false}>
                <Text style={pdfStyles.sectionTitle}>Images</Text>
                {renderPhotoRow(0)}
            </View>
            {Array.from({ length: rowCount - 1 }, (_, index) => renderPhotoRow(index + 1))}
        </View>
    );
};

export const AttendancePhoto = (props: Props) => {
    const { data } = props;

    return (
        <View wrap={false}>
            <Text style={pdfStyles.sectionTitle}>Attendance List</Text>
            <View style={pdfStyles.attendanceFrame}>
                {data.attendance_list_photo ? (
                    // eslint-disable-next-line jsx-a11y/alt-text
                    <Image src={data.attendance_list_photo} style={pdfStyles.attendancePhoto} />
                ) : <Text style={pdfStyles.emptyText}>No attendance list photo uploaded.</Text>}
            </View>
        </View>
    );
};
