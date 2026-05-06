import { SidebarTrigger } from "@/components/ui/sidebar";

interface NavbarProps {
  title: string;
}

export function Navbar({ title }: NavbarProps) {
  return (
    <header className="sticky rounded-t-xl top-0 z-50 w-full bg-background/95 shadow-sm backdrop-blur-sm supports-backdrop-filter:bg-background/60 dark:shadow-secondary">
      <div className="mx-4 sm:mx-8 flex h-14 items-center">
        <div className="relative mx-4 sm:mx-8 flex h-14 items-center">
          <SidebarTrigger className="relative -ml-4 mr-2 sm:absolute sm:-left-8" />
          <h1 className="font-bold">{title}</h1>
        </div>
      </div>
    </header>
  );
}
