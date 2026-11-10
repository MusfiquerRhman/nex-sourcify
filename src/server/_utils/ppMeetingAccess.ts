import type { Prisma, users } from "@prisma/client";
import { ADMIN_DEPARTMENT_ID, ADMIN_LEVEL_ID } from "~/utils/config";

type MeetingUser = Pick<users, 'id' | 'department_id' | 'level_id'>;

export const getPPMeetingOrderAccess = (user: MeetingUser): Prisma.buyer_ordersWhereInput => {
    if (user.department_id === ADMIN_DEPARTMENT_ID && user.level_id === ADMIN_LEVEL_ID) return {};

    return {
        buyers: {
            teams: {
                some: { team_members: { some: { user_id: user.id } } },
            },
        },
    };
};
