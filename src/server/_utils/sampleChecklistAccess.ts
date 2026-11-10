import type { Prisma, users } from "@prisma/client";
import { ADMIN_DEPARTMENT_ID, ADMIN_LEVEL_ID } from "../../utils/config";

type ChecklistUser = Pick<users, "id" | "department_id" | "level_id">;

export const getSampleChecklistBuyerAccess = (user: ChecklistUser): Prisma.buyersWhereInput => {
    if (user.department_id === ADMIN_DEPARTMENT_ID && user.level_id === ADMIN_LEVEL_ID) return {};

    return { teams: { some: { team_members: { some: { user_id: user.id } } } } };
};

export const getSampleChecklistAccess = (user: ChecklistUser): Prisma.sample_check_listWhereInput => {
    return { buyers: getSampleChecklistBuyerAccess(user) };
};
