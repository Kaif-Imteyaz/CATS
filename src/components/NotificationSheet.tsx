import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../components/ui/sheet';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Bell, Clock, Stethoscope, Trophy, Lightbulb, Check, Trash2 } from 'lucide-react';
import { useAppStore, type Notification } from '../stores/appStore';
import { cn } from '../lib/utils';
import { formatDistanceToNow } from 'date-fns';

const notificationIcons: Record<Notification['type'], typeof Bell> = {
  reminder: Clock,
  doctor: Stethoscope,
  achievement: Trophy,
  tip: Lightbulb,
};

const notificationColors: Record<Notification['type'], string> = {
  reminder: 'bg-primary/20 text-primary',
  doctor: 'bg-success/20 text-success',
  achievement: 'bg-warning/20 text-warning',
  tip: 'bg-accent/20 text-accent-foreground',
};

interface NotificationSheetProps {
  children: React.ReactNode;
}

export function NotificationSheet({ children }: NotificationSheetProps) {
  const { notifications, markNotificationRead, clearNotifications } = useAppStore();
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <div className="relative">
          {children}
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </div>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle>Notifications</SheetTitle>
            {notifications.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearNotifications}>
                <Trash2 size={14} className="mr-1" />
                Clear all
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-120px)]">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="mx-auto text-muted-foreground mb-3" size={32} />
              <p className="text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            notifications.map((notification) => {
              const Icon = notificationIcons[notification.type];
              const colorClass = notificationColors[notification.type];
              
              return (
                <Card 
                  key={notification.id}
                  variant={notification.read ? 'ghost' : 'default'}
                  className={cn(
                    'cursor-pointer transition-all',
                    !notification.read && 'border-l-4 border-l-primary'
                  )}
                  onClick={() => markNotificationRead(notification.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0', colorClass)}>
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={cn('font-semibold text-sm', !notification.read && 'text-foreground')}>
                            {notification.title}
                          </h4>
                          {notification.read && <Check size={14} className="text-muted-foreground flex-shrink-0" />}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}