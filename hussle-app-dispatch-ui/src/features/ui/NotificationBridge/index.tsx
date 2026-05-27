import { useEffect, useRef } from 'react';
// notistack import allowed here only — all other consumers (sagas,
// components) must go through the Redux notification slice via notify().
import { enqueueSnackbar } from 'notistack';
import { useDispatch, useSelector } from 'store';
import { consumed } from 'features/ui/store/reducers/notificationSlice';
import { selectPendingNotifications } from 'features/ui/store/selectors/notificationSelectors';

const NotificationBridge: React.FC = () => {
  const dispatch = useDispatch();
  const notifications = useSelector(selectPendingNotifications);
  const seenRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    notifications.forEach((n) => {
      if (seenRef.current.has(n.id)) {
        return;
      }
      seenRef.current.add(n.id);
      enqueueSnackbar(n.message, {
        key: n.id,
        variant: n.variant,
        ...(n.options ?? {}),
      });
      dispatch(consumed(n.id));
    });
  }, [notifications, dispatch]);

  return null;
};

export default NotificationBridge;
