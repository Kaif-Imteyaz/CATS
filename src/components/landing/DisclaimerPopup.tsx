"use client";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

const SESSION_KEY = "cats_disclaimer_shown";

export default function DisclaimerPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem(SESSION_KEY)) {
      setOpen(true);
      sessionStorage.setItem(SESSION_KEY, "1");
    }
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border flex-row items-center gap-3 space-y-0">
          <div className="w-9 h-9 rounded-xl bg-terracotta/10 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-terracotta" aria-hidden="true" />
          </div>
          <DialogTitle className="text-base font-bold text-deep" style={{ fontFamily: "var(--font-poppins)" }}>
            Medical Disclaimer
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-5 space-y-4 text-sm text-deep/70 leading-relaxed">
          <div className="bg-terracotta/8 border border-terracotta/20 rounded-xl px-4 py-3">
            <p className="font-semibold text-terracotta text-xs">
              CATS is not a medical device and does not provide medical diagnosis, treatment, or clinical care.
            </p>
          </div>

          <ul className="space-y-2 text-deep/60 text-xs">
            {[
              "Consult a healthcare professional before starting any exercise program.",
              "Stop immediately if you feel pain, dizziness, or any sudden symptom.",
              "Do not use CATS during a medical emergency - call emergency services.",
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-terracotta flex-shrink-0 mt-0.5">•</span>
                {item}
              </li>
            ))}
          </ul>

          <p className="text-xs text-deep/50">
            By continuing, you acknowledge these limitations and accept any associated risks of physical exercise.
          </p>
        </div>

        <div className="px-6 pb-6">
          <Button
            className="w-full bg-primary hover:bg-primary/90 text-white rounded-full"
            onClick={() => setOpen(false)}
          >
            I Understand, Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
