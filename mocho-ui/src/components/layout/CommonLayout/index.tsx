import {lazy, Suspense} from 'react';
import {Outlet} from 'react-router-dom';
import Loader from '../../Loadable/Loader';

const Header = lazy(() => import('./Header'));
const FooterBlock = lazy(() => import('./FooterBlock'));

const CommonLayout = ({layout = 'blank'}: {layout?: string}) => (
  <>
    {(layout === 'landing' || layout === 'simple') && (
      <Suspense fallback={<Loader />}>
        <Header layout={layout} />
        <Outlet />
        <FooterBlock isFull={layout === 'landing'} />
      </Suspense>
    )}
    {layout === 'blank' && <Outlet />}
  </>
);

export default CommonLayout;
