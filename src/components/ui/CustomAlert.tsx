import { useEffect } from "react";
import { Alert, Box } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../../storage/hooks";
import { removeAlertAC } from "../../storage/alertSlice";

const CustomAlert = () => {
  const { text, mode } = useAppSelector((state) => state.alert);
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (text) {
      const timer = setTimeout(() => {
        dispatch(removeAlertAC());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [text, dispatch]);

  return (
    <AnimatePresence>
      {text && (
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.2 } }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          sx={{
            position: "fixed",
            top: 24,
            right: 24,
            zIndex: 9999,
            maxWidth: "400px",
            minWidth: "300px",
          }}
        >
          <Alert
            variant="filled"
            severity={mode}
            onClose={() => dispatch(removeAlertAC())}
            sx={{
              borderRadius: "12px",
              boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.15)",
              fontSize: "14px",
              fontWeight: 500,
              background: mode === 'success' 
                ? 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)' 
                : mode === 'error'
                ? 'linear-gradient(135deg, #EF5350 0%, #C62828 100%)'
                : mode === 'warning'
                ? 'linear-gradient(135deg, #FFB74D 0%, #F57C00 100%)'
                : 'linear-gradient(135deg, #42A5F5 0%, #1565C0 100%)',
              color: '#ffffff',
              '& .MuiAlert-icon': {
                color: '#ffffff',
              },
              '& .MuiAlert-action': {
                color: '#ffffff',
              }
            }}
          >
            {t(text)}
          </Alert>
        </Box>
      )}
    </AnimatePresence>
  );
};

export default CustomAlert;
