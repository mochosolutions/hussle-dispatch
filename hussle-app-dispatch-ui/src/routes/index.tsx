import { createBrowserRouter } from 'react-router-dom';
import App from '../App';
import HomeRoutes from 'pages/home/routes/HomeRoutes';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [...HomeRoutes],
  },
]);

export default router;
