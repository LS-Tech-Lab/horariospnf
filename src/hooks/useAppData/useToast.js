// Notificaciones tipo "toast" de la aplicación. Extraído de useAppData.js.

import { useState, useCallback } from "react";

export default function useToast() {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    if (!message) { setToast(null); return; }
    setToast(null);
    setTimeout(() => setToast({ message, type }), 50);
  }, []);

  const hideToast = useCallback(() => setToast(null), []);

  return { toast, showToast, hideToast };
}
