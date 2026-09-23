import Docs from "@/components/docs";
import { TrashIcon } from "@/components/icons";
import { formatFileSize, truncateFileName } from "@/utility";
import type { FileState } from "./index";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface UploadItemProps {
  file: FileState;
  onDelete: (file: FileState) => void;
}

export default function UploadItem({ file, onDelete }: UploadItemProps) {
  const name = file.file?.name ?? file.result?.name ?? "unknown";
  const size = file.file?.size ?? file.result?.size ?? 0;
  const isComplete = file.progress >= 100;

  return (
    <Card size="sm" className="gap-0 border border-border/70 bg-background py-0 shadow-sm">
      <CardHeader className="px-4 py-3">
        <div className="flex items-start gap-3">
          <Docs name={name} />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <CardTitle className="truncate font-inter text-sm text-foreground">
                  {truncateFileName(name, 60)}
                </CardTitle>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <p className="font-inter text-xs text-muted-foreground">
                    {formatFileSize(Number(size))}
                  </p>
                  <Badge variant="outline" className={cn("shrink-0", isComplete && "border-transparent bg-secondary text-secondary-foreground")}>
                    {isComplete ? "Ready" : "Uploading"}
                  </Badge>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => onDelete(file)}
                aria-label={`Remove ${name}`}
              >
                <TrashIcon width={13} height={13} />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="flex items-center gap-3">
          <Progress value={file.progress} className="h-2.5 flex-1" />
          <span className="w-11 text-right font-inter text-xs font-medium text-muted-foreground">
            {file.progress}%
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
