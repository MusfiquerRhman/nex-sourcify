export const getModulePath = (pathname: string) => {
    const segments = pathname.split('/').filter(Boolean);
    const actionIndex = segments.findIndex((segment) => segment === 'new' || segment === 'edit');
    const moduleSegments = actionIndex === -1 ? segments : segments.slice(0, actionIndex);
    const action = segments[actionIndex];

    return { path: `/${moduleSegments.join('/')}`, new: action === 'new', edit: action === 'edit' };
};
