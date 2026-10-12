import { useEffect, useRef, type CSSProperties, type FC, type ReactNode } from 'react';
import ReactDOM from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { alpha, useTheme } from '@mui/material/styles';

interface IProps {
  isVisible: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Overrides for the panel, e.g. width and padding of a specific popup. */
  style?: CSSProperties;
  /** Id of the popup's title, announced by screen readers. */
  labelledBy?: string;
  /** Id of the popup's description. */
  describedBy?: string;
}

const BasePopup: FC<IProps> = ({
  isVisible,
  onClose,
  children,
  style,
  labelledBy,
  describedBy,
}) => {
  const theme = useTheme();
  const panelRef = useRef<HTMLDivElement>(null);

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  // Latest onClose without re-running the effect below when a caller passes
  // a new function on every render.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Escape closes; focus moves into the popup and returns to whatever opened it.
  useEffect(() => {
    if (!isVisible) return;
    const opener = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      opener?.focus?.();
    };
  }, [isVisible]);

  return ReactDOM.createPortal(
    <AnimatePresence>
      {isVisible && (
        <>
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-100"
            style={{ backgroundColor: alpha('#01132F', 0.5) }}
            onClick={handleClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            key="modal"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            aria-describedby={describedBy}
            tabIndex={-1}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-[92vw]
                       sm:w-auto sm:min-w-120 sm:max-w-[90vw] max-h-[90vh] overflow-y-auto m-0
                       z-500 shadow-lg p-4 outline-none"
            style={{
              backgroundColor: theme.palette.background.paper,
              borderRadius: theme.shape.borderRadius,
              color: theme.palette.text.primary,
              ...style,
            }}
            initial={{ opacity: 0, scale: 0.5, y: -100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -100 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
};

export default BasePopup;
