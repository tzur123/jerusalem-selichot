import type { ReactNode } from "react";
import { Card, CardTitle, CardSubtitle } from "./Card";
import { Button } from "./Button";

export function ErrorState({
  title,
  description,
  retryLabel = "נסו שוב",
  onRetry,
  secondaryAction,
  icon,
}: {
  title: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void;
  secondaryAction?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <Card className="text-center flex flex-col items-center gap-3 py-8" role="alert">
      {icon && <div aria-hidden>{icon}</div>}
      <CardTitle>{title}</CardTitle>
      {description && <CardSubtitle>{description}</CardSubtitle>}
      <div className="flex flex-col sm:flex-row gap-3 mt-3 w-full">
        {onRetry && (
          <Button variant="primary" fullWidth onClick={onRetry}>
            {retryLabel}
          </Button>
        )}
        {secondaryAction}
      </div>
    </Card>
  );
}
