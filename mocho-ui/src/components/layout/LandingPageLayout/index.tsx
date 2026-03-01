import { lazy, Suspense } from 'react';
import styled from 'styled-components';
import { Outlet } from 'react-router-dom';
import Loader from '../../Loadable/Loader';

const Header = lazy(() => import('./Header'));
const FooterBlock = lazy(() => import('./FooterBlock'));


export const PageContainer = styled.div`
    display: grid;
    grid-template-rows: auto 1fr auto;
    justify-items: center;
    min-height: 100vh;
`;


export const HeaderContainer = styled.header`
    display: flex;
    grid-row-start: 1;
    width: 100%;
    height: 80px;
`

export const MainContainer = styled.main`
    display: flex;
    flex-direction: column;
    grid-row-start: 2;  
    width: 100%;
    background-color: white;
`

export const FooterContainer = styled.footer`
    display: flex;
    flex-direction: column;
    grid-row-start: 3;
    width: 100%;
`


export default function SimpleLayout() {
	return (
		<Suspense fallback={<Loader />}>
			<PageContainer>

                <HeaderContainer>
                    <Header />
				</HeaderContainer>
				<MainContainer>
                    {/* <Toolbar /> */}
					<Outlet />
				</MainContainer>
                <FooterContainer>
                    <FooterBlock isFull/>
                </FooterContainer>  
			</PageContainer>
		</Suspense>
	);
}
