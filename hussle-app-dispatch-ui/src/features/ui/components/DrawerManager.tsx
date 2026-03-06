// import React from 'react';
// import { Drawer, Box, IconButton, Divider } from '@mui/material';
// import { CloseOutlined } from '@ant-design/icons';
// import { useSelector, useDispatch } from 'store';
// import { closeDrawer } from './store/uiSlice';
// import type { RootState } from 'store';
// // import BulkPostActionsDrawer from 'pages/blog/components/BulkActionsDrawer';
// // import BulkAuthorActionsDrawer from 'pages/blog/components/BulkAuthorActionsDrawer';
// // import BulkCategoryActionsDrawer from 'pages/blog/components/BulkCategoryActionsDrawer';

// // Inline selector to avoid module resolution issues
// const currentDrawerSelector = (state: RootState) => state.ui.drawer;

// /**
//  * Drawer Component Lookup Table
//  *
//  * Maps drawer type strings to React components.
//  * Add new drawer types here as needed.
//  */
// // const drawerComponentLookupTable: Record<string, React.ComponentType<any>> = {
// //   bulkPostActions: BulkPostActionsDrawer,
// //   bulkAuthorActions: BulkAuthorActionsDrawer,
// //   bulkCategoryActions: BulkCategoryActionsDrawer,
// // };

// const DEFAULT_WIDTH = 400;

// const DrawerManager = ({
//   drawerComponentLookupTable = {}, // Pass an empty object by default to avoid undefined errors
// }) => {
//   const dispatch = useDispatch();
//   const currentDrawer = useSelector(currentDrawerSelector);

//   if (!currentDrawer) return null;

//   const {
//     drawerType,
//     drawerProps = {},
//     anchor = 'right',
//     width = DEFAULT_WIDTH,
//     disableBackdropClose = false,
//   } = currentDrawer;

//   const DrawerContent = drawerComponentLookupTable[drawerType];

//   if (!DrawerContent) {
//     return null;
//   }

//   const handleClose = () => {
//     dispatch(closeDrawer());
//   };

//   const handleBackdropClick = (_event: {}, reason: 'backdropClick' | 'escapeKeyDown') => {
//     if (reason === 'backdropClick' && disableBackdropClose) {
//       return;
//     }
//     handleClose();
//   };

//   return (
//     <Drawer
//       anchor={anchor}
//       open={true}
//       onClose={handleBackdropClick}
//       PaperProps={{
//         sx: { width },
//       }}
//     >
//       <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
//         <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
//           <IconButton onClick={handleClose} size="small" aria-label="close drawer">
//             <CloseOutlined />
//           </IconButton>
//         </Box>
//         <Divider />
//         <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
//           <DrawerContent {...drawerProps} onClose={handleClose} />
//         </Box>
//       </Box>
//     </Drawer>
//   );
// };

// export default DrawerManager;
