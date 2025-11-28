import Button from "./Button";
import { useSubscriptionStatus } from "@/hooks/use-subscription";
import { payWithFlutterwave } from "@/lib/payments";
import { useEffect, useState } from "react";

type Props = {
  purpose: "reader_subscription" | "author_premium";
  amountNgn: number;
};

export default function Paywall({ purpose, amountNgn }: Props) {
  const { active, loading, userId } = useSubscriptionStatus();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!loading && !active);
  }, [active, loading]);

  if (!visible) return null;

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-sm">
      <div className="text-center max-w-md p-6 bg-white rounded-xl border border-border shadow">
        <h3 className="font-poppins font-bold text-xl text-foreground mb-2">Premium content</h3>
        <p className="text-muted-foreground mb-4">Subscribe to unlock full access.</p>
        <div className="flex gap-3 justify-center">
          <Button
            size="md"
            onClick={async () => {
              if (!userId) return;
              await payWithFlutterwave({
                purpose,
                amount: amountNgn,
                currency: "NGN",
                user: { id: userId },
                onVerified: (res) => {
                  // Let realtime subscription hook flip visibility; do not hide optimistically
                },
              });
            }}
          >
            Subscribe — ₦{amountNgn.toLocaleString()}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-3">Sandbox payment — completes in a modal; console shows status.</p>
      </div>
    </div>
  );
}
