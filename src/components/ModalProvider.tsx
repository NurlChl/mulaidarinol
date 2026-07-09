"use client";

import React, { createContext, useContext, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Info, 
  X 
} from "lucide-react";

interface ModalOptions {
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "error";
  onConfirm?: () => void | Promise<void>;
  confirmText?: string;
  cancelText?: string;
}

interface ModalContextType {
  showModal: (options: ModalOptions) => void;
  hideModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [modalOptions, setModalOptions] = useState<ModalOptions | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const showModal = (options: ModalOptions) => {
    setModalOptions(options);
    setIsOpen(true);
    setLoading(false);
  };

  const hideModal = () => {
    setIsOpen(false);
    setTimeout(() => {
      setModalOptions(null);
    }, 200);
  };

  const handleConfirm = async () => {
    if (modalOptions?.onConfirm) {
      try {
        setLoading(true);
        await modalOptions.onConfirm();
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    hideModal();
  };

  const getIcon = (type = "info") => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="h-10 w-10 text-emerald-500" />;
      case "warning":
        return <AlertTriangle className="h-10 w-10 text-amber-500" />;
      case "error":
        return <XCircle className="h-10 w-10 text-destructive" />;
      default:
        return <Info className="h-10 w-10 text-primary" />;
    }
  };

  return (
    <ModalContext.Provider value={{ showModal, hideModal }}>
      {children}

      <AnimatePresence>
        {isOpen && modalOptions && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={hideModal}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
              className="relative w-full max-w-sm rounded-2xl bg-card border border-border p-6 shadow-2xl z-10 overflow-hidden"
            >
              {/* Close Button */}
              <button
                onClick={hideModal}
                className="absolute right-4 top-4 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Icon & Heading */}
              <div className="flex flex-col items-center text-center mt-3 mb-4">
                <div className="mb-3.5 p-2 bg-secondary/50 rounded-full border border-border/50 shrink-0">
                  {getIcon(modalOptions.type)}
                </div>
                <h3 className="text-base font-extrabold text-foreground tracking-tight px-2 leading-snug">
                  {modalOptions.title}
                </h3>
              </div>

              {/* Message Body */}
              <p className="text-xs text-muted-foreground text-center leading-relaxed mb-6 px-1">
                {modalOptions.message}
              </p>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5">
                {modalOptions.onConfirm ? (
                  <>
                    <button
                      onClick={hideModal}
                      disabled={loading}
                      className="flex-1 py-2 px-3 border border-border rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {modalOptions.cancelText || "Batal"}
                    </button>
                    <button
                      onClick={handleConfirm}
                      disabled={loading}
                      className="flex-1 py-2 px-3 bg-primary text-primary-foreground hover:bg-primary/95 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-lg shadow-primary/10 disabled:opacity-50"
                    >
                      {loading ? "Memproses..." : (modalOptions.confirmText || "Ya, Lanjutkan")}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={hideModal}
                    className="w-full py-2 bg-secondary border border-border hover:bg-muted text-xs font-bold text-foreground rounded-xl transition-all cursor-pointer shadow-sm text-center"
                  >
                    {modalOptions.confirmText || "OK, Tutup"}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
}
