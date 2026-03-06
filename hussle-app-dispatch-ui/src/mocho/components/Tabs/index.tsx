import { Children,  cloneElement, useState, SyntheticEvent } from 'react';
import { Box, Tab, Tabs, Stack, Divider } from '@mui/material';

export interface TabsProps {
  children?: React.ReactElement | React.ReactNode | string;
  value: string | number;
  index: number;
}

export const TabPanel = ({ children, value, index, ...other }: TabsProps) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`product-details-tabpanel-${index}`}
      aria-labelledby={`product-details-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
};

export const TabComponent = ({ children }: any) => {
  const [activeTab, setActiveTab] = useState(0);
  const arrayChildren = Children.toArray(children);

  const onClickTabItem = (event: SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Stack spacing={3}>
      <Stack>
        <Tabs
          value={activeTab}
          indicatorColor="primary"
          onChange={onClickTabItem}
          aria-label="product description tabs example"
          variant="scrollable"
        >
          {Children.map(arrayChildren, (child: any, index) => {
            const { label } = child.props;
            return (
              <Tab
                // component={Link}
                label={label}
                id={label}
              />
            );
          })}
        </Tabs>
        <Divider />
      </Stack>

      {Children.map(arrayChildren, (child: any, index) => {
            if (activeTab !== index) return undefined;
            const element = cloneElement(child, { index });
            return(
                <TabPanel index={index} value={index}>
                    {element}
                </TabPanel>
            )

          })}

    </Stack>
  );
};
