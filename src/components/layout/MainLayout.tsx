import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { NotificationsButton } from '@/components/notifications/NotificationsButton';

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 flex flex-col relative overflow-x-hidden">
          <header className="sticky top-0 left-0 right-0 z-40 flex h-14 items-center justify-between border-b bg-background px-4 shrink-0">
            <SidebarTrigger />
            <NotificationsButton />
          </header>
          <div className="flex-1 p-6 overflow-auto">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
};
