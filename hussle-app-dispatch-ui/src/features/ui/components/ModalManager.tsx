// import { useSelector } from 'store';
// import { currentModalSelector } from './store/selectors';
// import ConfirmDialog from 'components/ConfirmDialog';
// import DirtyFormConfirmDialog from 'components/DirtyFormConfirmDialog';
// import InviteUserDialog from 'features/organizations/sections/InviteUserDialog';
// import CreateTenantDialog from 'features/organizations/sections/CreateOrganizationsDialog';
// import UpdateTenantDialog from 'features/organizations/sections/UpdateTenantDialog';

// const modalComponentLookupTable = {
//   confirmDialog: ConfirmDialog, // Generic reusable confirmation dialog
//   dirtyFormConfirm: DirtyFormConfirmDialog, // Dirty form navigation blocking
//   createTenant: CreateTenantDialog,
//   updateTenant: UpdateTenantDialog,
//   inviteUser: InviteUserDialog,
// };

// const ModalManager = () => {
//   const currentModal = useSelector(currentModalSelector);
//   let renderedModal;

//   if (currentModal) {
//     const { modalType, modalProps = {} } = currentModal;
//     const ModalComponent = modalComponentLookupTable[modalType];

//     renderedModal = <ModalComponent {...modalProps} />;
//   }

//   return <span>{renderedModal}</span>;
// };

// export default ModalManager;
