import { useState, useEffect } from "react";
import { Button } from "antd";
import { RefreshCcw } from "lucide-react";

interface CountdownTimerProps {
  initialCountdown: number;
  onTick: () => void;
}

export function CountdownTimer({
  initialCountdown,
  onTick,
}: CountdownTimerProps) {
  const [countdown, setCountdown] = useState(initialCountdown);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          onTick();
          return initialCountdown;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [initialCountdown, onTick]);

  const handleRefresh = () => {
    onTick();
    setCountdown(initialCountdown);
  };

  return (
    <Button
      type="primary"
      className="absolute z-20 flex items-center"
      onClick={handleRefresh}
    >
      <span>
        {Math.floor(countdown / 60)}:
        {(countdown % 60).toString().padStart(2, "0")}
      </span>
      <RefreshCcw className="w-3.5 h-3.5" />
    </Button>
  );
}
