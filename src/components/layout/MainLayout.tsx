import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 flex flex-col relative">
          <header className="sticky top-0 z-40 flex h-14 items-center border-b bg-background px-4 shrink-0">
            <SidebarTrigger />
          </header>
          <div className="flex-1 p-6 relative z-0 overflow-auto">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
};
