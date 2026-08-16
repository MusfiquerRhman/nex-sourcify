'use client';

import React from "react";
import FactoryDetailsPage from "../../_components/details";
import { useNavigationStore, usePermissionStore } from "~/store";
import { useModulePath } from "~/hooks";
import type { ParamsProp } from "~/types/params";

const EditFactoryPage = ({ params }: ParamsProp) => {
    // Get current module path
    const modulePath = useModulePath().path;
        
    // Get current module permissions
    const pathId = useNavigationStore((s) => s.getByHref(modulePath));
    const permissions = usePermissionStore(s => (pathId ? s.permission[pathId] : undefined));
    const { can_update } = permissions ?? {};

    return (
        <FactoryDetailsPage params={params} disabled={!can_update}/>
    );
};

export default EditFactoryPage;