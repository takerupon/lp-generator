import { Toaster as Sonner } from "@/components/ui/sonner";
import LPGenerator from "@/components/LPGenerator";

const App = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col">
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="bg-primary/10 p-1.5 md:p-2 rounded-md">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-primary"
                >
                  <path
                    d="M5 8H19M5 12H19M12 16H19"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <h1 className="text-lg md:text-xl font-bold text-primary tracking-tight">
                LP Generator
              </h1>
            </div>
            <div className="text-xs md:text-sm bg-primary/10 px-3 py-1 rounded-full text-primary font-medium border border-primary/20 shadow-sm">
              AIでかんたんLP作成
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow py-6 md:py-8 container mx-auto px-4">
        <LPGenerator />
      </main>

      <footer className="mt-auto py-6 border-t bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} LP Generator App. All rights reserved.
            </p>
            <div className="flex space-x-4 items-center">
              <a
                href="#"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                利用規約
              </a>
              <span className="text-muted-foreground/30">|</span>
              <a
                href="#"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                プライバシーポリシー
              </a>
              <span className="text-muted-foreground/30">|</span>
              <a
                href="#"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                お問い合わせ
              </a>
            </div>
          </div>
        </div>
      </footer>

      <Sonner closeButton position="top-right" className="z-50" />
    </div>
  );
};

export default App;
