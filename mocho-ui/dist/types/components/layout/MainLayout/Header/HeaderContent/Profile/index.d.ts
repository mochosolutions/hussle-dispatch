export interface ProfileProps {
    user?: {
        name: string;
        organizationName?: string;
        avatar?: string;
    };
    onLogout?: () => void;
}
declare const Profile: ({ user, onLogout }: ProfileProps) => import("@emotion/react/jsx-runtime").JSX.Element;
export default Profile;
//# sourceMappingURL=index.d.ts.map