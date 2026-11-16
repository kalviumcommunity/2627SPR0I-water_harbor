import { useState, useCallback } from 'react';
import { NotificationContext } from './NotificationContext';

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const showNotification = useCallback((message, type = 'info', durationMs = 5000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    const item = { id, message, type };

    setNotifications((prev) => [...prev, item]);

    if (durationMs > 0) {
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, durationMs);
    }

    return id;
  }, []);

  const dismissNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const notifySuccess = useCallback(
    (msg, duration) => showNotification(msg, 'success', duration),
    [showNotification]
  );
  const notifyError = useCallback(
    (msg, duration) => showNotification(msg, 'error', duration),
    [showNotification]
  );
  const notifyWarning = useCallback(
    (msg, duration) => showNotification(msg, 'warning', duration),
    [showNotification]
  );
  const notifyInfo = useCallback(
    (msg, duration) => showNotification(msg, 'info', duration),
    [showNotification]
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        showNotification,
        dismissNotification,
        notifySuccess,
        notifyError,
        notifyWarning,
        notifyInfo,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export default NotificationProvider;
