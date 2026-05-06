"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { LogActionBadge } from "@/components/common/log-action-badge";

interface ActivityItem {
  id: number;
  action: string;
  details: string | null;
  userId: number | null;
  userName: string | null;
  createdAt: Date;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="border-b border-gray-100 dark:border-gray-800">
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {activity.userName || "System"}
                      </p>
                      <LogActionBadge action={activity.action} />
                    </div>
                    {activity.details && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {activity.details}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-500 ml-4">
                    {(() => {
                      const date = new Date(activity.createdAt);
                      // Add 5 hours to correct for UTC offset (Winnipeg is UTC-5 in summer)
                      date.setHours(date.getHours() + 5);
                      return formatDistanceToNow(date, { addSuffix: true });
                    })()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
