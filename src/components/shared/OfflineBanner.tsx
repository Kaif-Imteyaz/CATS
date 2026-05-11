"use client";
import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { motion, AnimatePresence } from "framer-motion";

export default function OfflineBanner() {
  const online = useOnlineStatus();

  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed top-0 left-0 right-0 z-[100] bg-terracotta text-white flex items-center justify-center gap-2 py-2.5 text-sm font-medium"
          role="alert"
          aria-live="assertive"
        >
          <WifiOff className="w-4 h-4 flex-shrink-0" />
          No internet connection — some features unavailable
        </motion.div>
      )}
    </AnimatePresence>
  );
}
