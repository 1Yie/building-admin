import { useState, useEffect } from "react";
import { Button } from "antd";
import { RefreshCcw } from "lucide-react";

interface CountdownTimerProps {
  initialCountdown: number;
  onTick: () => void;
  isLoading: boolean;
}

export function CountdownTimer({
  initialCountdown,
  onTick,
  isLoading,
}: CountdownTimerProps) {
  const [countdown, setCountdown] = useState(initialCountdown);

  useEffect(() => {
    if (isLoading) {
      setCountdown(initialCountdown);
    }
  }, [isLoading, initialCountdown]);

  useEffect(() => {
    if (isLoading) {
      return;
    }
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
  }, [initialCountdown, onTick, isLoading]);

  const handleRefresh = () => {
    if (isLoading) {
      return;
    }
    onTick();
    setCountdown(initialCountdown);
  };

  return (
    <Button
      type="primary"
      className="absolute z-20 flex items-center"
      onClick={handleRefresh}
      disabled={isLoading}
      loading={isLoading}
    >
      {!isLoading && (
        <div className="flex items-center">
          <span>
            {Math.floor(countdown / 60)}:
            {(countdown % 60).toString().padStart(2, "0")}
          </span>
          <RefreshCcw className="w-3.5 h-3.5 ml-1" />
        </div>
      )}
    </Button>
  );
}
