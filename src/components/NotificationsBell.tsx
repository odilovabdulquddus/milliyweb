import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getMyNotifications, markNotificationsRead, checkMyReminders } from "@/lib/orders.functions";
import { useEffect } from "react";

export function NotificationsBell() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => getMyNotifications(),
    refetchInterval: 60_000,
  });
  const items = data?.notifications ?? [];
  const unread = items.filter((n) => !n.is_read).length;

  useEffect(() => {
    checkMyReminders().then(() => qc.invalidateQueries({ queryKey: ["notifications"] })).catch(() => {});
  }, [qc]);

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (!open && unread > 0) {
          markNotificationsRead().then(() => qc.invalidateQueries({ queryKey: ["notifications"] }));
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Ogohlantirishlar</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 && <p className="px-2 py-6 text-center text-sm text-muted-foreground">Hozircha yo'q</p>}
          {items.map((n) => (
            <div key={n.id} className={`rounded-md px-2 py-2 text-sm ${n.is_read ? "opacity-60" : ""}`}>
              <p className="font-medium">{n.title}</p>
              {n.body && <p className="text-xs text-muted-foreground">{n.body}</p>}
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                {new Date(n.created_at).toLocaleString("uz-UZ")}
              </p>
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}