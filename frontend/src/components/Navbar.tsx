import { cn } from '@/lib/utils';
import RhombusLogo from '../assets/RhombusAI.svg';

interface NavbarProps {
  className?: string;
}

export function Navbar({ className }: NavbarProps) {
  return (
    <nav
      className={cn(
        'border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        className
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and brand */}
          <div className="flex items-center space-x-3">
            <img src={RhombusLogo} alt="Rhombus AI" className="h-8 w-8" />
            <div className="flex flex-col">
              <span className="text-lg font-bold">Rhombus AI</span>
            </div>
          </div>

          {/* Navigation items (can be expanded later) */}
          <div className="flex items-center space-x-4">
            {/* Add navigation items here if needed */}
          </div>
        </div>
      </div>
    </nav>
  );
}
