import { ReactNode } from 'react';
import { CustomizationProps } from '../types/config';
declare const ConfigContext: import('react').Context<CustomizationProps>;
type ConfigProviderProps = {
    children: ReactNode;
};
declare function ConfigProvider({ children }: ConfigProviderProps): import("@emotion/react/jsx-runtime").JSX.Element;
export { ConfigProvider, ConfigContext };
//# sourceMappingURL=ConfigContext.d.ts.map