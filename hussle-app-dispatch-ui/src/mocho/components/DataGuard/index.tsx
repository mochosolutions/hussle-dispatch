import type { ReactNode } from 'react';

export interface DataGuardProps<T> {
  data: T | null | undefined;
  emptyComponent?: ReactNode;
  children: (data: T) => ReactNode;
}

export const DataGuard = <T,>({
  data,
  emptyComponent = null,
  children,
}: DataGuardProps<T>): ReactNode => {
  if (data == null) return <>{emptyComponent}</>;
  return <>{children(data)}</>;
};
