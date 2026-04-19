import { ToastProvider } from "@/hooks/useToast";
import { PremiumTopBar } from "@/components/PremiumTopBar";

export default function PremiumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <div className="h-screen bg-black text-white flex flex-col overflow-hidden">
        <PremiumTopBar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </ToastProvider>
  );
}
