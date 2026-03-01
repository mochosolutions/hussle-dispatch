import {FormattedMessage} from '../../third-party/FormattedMessage';
import {
  UploadOutlined,
  HomeOutlined,
  SettingOutlined,
  SearchOutlined,
  FileTextOutlined,
  ExperimentOutlined,
} from '@ant-design/icons';
import {NavItemType} from '../../../types/menu';


const icons = {
  uploader: UploadOutlined,
  dashboard: HomeOutlined,
  search: SearchOutlined,
  settings: SettingOutlined,
  blog: FileTextOutlined,
  components: ExperimentOutlined,
};

const DashboardmenuItems: NavItemType = {
  id: 'dashboard',
  title: <FormattedMessage id="dashboard" />,
  type: 'group',
  children: [
    {
      id: 'dashboard-page',
      title: <FormattedMessage id="dashboard" />,
      type: 'item',
      url: '/',
      icon: icons.dashboard,
    },
    {
      id: 'organizations',
      title: <FormattedMessage id="Organizations" />,
      type: 'item',
      url: '/organizations',
      icon: icons.settings,
    },

    {
      id: 'blog',
      title: <FormattedMessage id="Blog Posts" />,
      type: 'collapse',
      url: '/blog',
      icon: icons.blog,
      // type: 'collapse',
      children: [
           {
              id: 'menu-posts',
              title: (
                <>
                  <FormattedMessage id="Posts" />
                </>
              ),
              type: 'item',
              url: '/blog'
            },
           {
              id: 'menu-author',
              title: (
                <>
                  <FormattedMessage id="Authors" />
                </>
              ),
              type: 'item',
              url: '/authors'
            },
            {
              id: 'menu-category',
              title: (
                <>
                  <FormattedMessage id="Categories" />
                </>
              ),
              type: 'item',
              url: '/categories'
            },
      ]
    },
    {
      id: 'components-test',
      title: <FormattedMessage id="Components Test" />,
      type: 'item',
      url: '/components',
      icon: icons.components,
    },
  ],
};

export default DashboardmenuItems;
