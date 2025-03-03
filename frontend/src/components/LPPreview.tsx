import { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Code,
  Download,
  Eye,
  Share2,
  Copy,
  CheckCheck,
  RefreshCcw,
  Smartphone,
  Laptop,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { LPData } from "@/types";
import { cn } from "@/lib/utils";

// コンポーネントのプロップスの型定義
type LPPreviewProps = {
  data: LPData;
  onDownload: () => void;
  onShare: () => void;
};

const LPPreview = ({ data, onDownload, onShare }: LPPreviewProps) => {
  const [activeTab, setActiveTab] = useState<string>("preview");
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copyStatus, setCopyStatus] = useState<Record<string, boolean>>({
    html: false,
    css: false,
    js: false,
  });
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // プレビュー用のHTMLを生成し、Blobとして保存
  useEffect(() => {
    if (!data) return;
    setIsLoading(true);

    // 完全なHTMLドキュメントを作成
    const fullHtml = `
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>LP Preview</title>
        <style>${data.css}</style>
        <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
      </head>
      <body>
        ${data.html}
        <script>
          ${data.js}
          // アイコンの初期化（もし必要なら）
          if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') {
            lucide.createIcons();
          }
        </script>
      </body>
      </html>
    `;

    // HTMLをBlobに変換してURLを生成
    const blob = new Blob([fullHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    setIframeUrl(url);

    // クリーンアップ関数
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [data]);

  // iframeがロードされた時に呼ばれるハンドラ
  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  // コードをクリップボードにコピーする関数
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        // コピー状態を更新
        setCopyStatus((prev) => ({ ...prev, [type.toLowerCase()]: true }));

        // トースト表示
        toast.success("コピーしました", {
          description: `${type}コードをクリップボードにコピーしました。`,
        });

        // 3秒後にコピー状態をリセット
        setTimeout(() => {
          setCopyStatus((prev) => ({ ...prev, [type.toLowerCase()]: false }));
        }, 3000);
      },
      () => {
        toast.error("コピーに失敗しました", {
          description: "クリップボードへのコピーに失敗しました。もう一度お試しください。",
        });
      }
    );
  };

  // iframeをリロードする関数
  const reloadIframe = () => {
    if (iframeRef.current) {
      const currentSrc = iframeRef.current.src;
      iframeRef.current.src = "";
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.src = currentSrc;
        }
      }, 50);
      setIsLoading(true);
      toast.info("プレビューを更新しています...");
    }
  };

  return (
    <Card className="w-full shadow-lg border border-gray-100 overflow-hidden bg-white">
      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b relative py-4">
        <div className="absolute inset-0 bg-grid-primary/10 mask-fade"></div>
        <div className="relative">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
            <CardTitle className="text-xl text-green-800">LP プレビュー</CardTitle>
            <div className="flex items-center gap-2">
              <div className="bg-white rounded-md p-0.5 shadow-sm border">
                <div className="flex items-center bg-muted rounded-sm overflow-hidden">
                  <Button
                    size="sm"
                    variant="ghost"
                    className={cn(
                      "h-8 rounded-none text-xs",
                      viewMode === "desktop"
                        ? "bg-background text-foreground"
                        : "hover:text-foreground"
                    )}
                    onClick={() => setViewMode("desktop")}
                  >
                    <Laptop className="h-3.5 w-3.5 mr-1" />
                    PC
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={cn(
                      "h-8 rounded-none text-xs",
                      viewMode === "mobile"
                        ? "bg-background text-foreground"
                        : "hover:text-foreground"
                    )}
                    onClick={() => setViewMode("mobile")}
                  >
                    <Smartphone className="h-3.5 w-3.5 mr-1" />
                    スマホ
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <CardDescription className="mt-1">
            AIによって生成されたランディングページのプレビューとコードを表示します。
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b bg-gray-50 sticky top-0 z-10">
            <div className="px-4 pt-2">
              <TabsList className="bg-white/80 border shadow-sm mb-2 grid grid-cols-4">
                <TabsTrigger value="preview" className="flex items-center gap-1 text-xs">
                  <Eye className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">プレビュー</span>
                </TabsTrigger>
                <TabsTrigger value="html" className="flex items-center gap-1 text-xs">
                  <Code className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">HTML</span>
                </TabsTrigger>
                <TabsTrigger value="css" className="flex items-center gap-1 text-xs">
                  <Code className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">CSS</span>
                </TabsTrigger>
                <TabsTrigger value="js" className="flex items-center gap-1 text-xs">
                  <Code className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">JS</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          {/* プレビュータブ */}
          <TabsContent value="preview" className="mt-0 relative">
            <div
              className={cn(
                "relative mx-auto transition-all duration-300 ease-in-out bg-gray-50 min-h-[400px]",
                viewMode === "mobile"
                  ? "w-[375px] h-[667px] mt-6 mb-6 shadow-md rounded-xl border overflow-hidden"
                  : "w-full"
              )}
            >
              {isLoading && (
                <div className="absolute inset-0 bg-gray-50 flex flex-col items-center justify-center z-10 gap-3">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  <p className="text-sm text-muted-foreground">プレビューを読み込み中...</p>
                </div>
              )}
              {iframeUrl ? (
                <iframe
                  ref={iframeRef}
                  src={iframeUrl}
                  className={cn(
                    "w-full h-full border-0 transition-opacity",
                    isLoading ? "opacity-0" : "opacity-100"
                  )}
                  title="Landing Page Preview"
                  sandbox="allow-scripts allow-same-origin"
                  onLoad={handleIframeLoad}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  プレビューを準備中...
                </div>
              )}
              {!isLoading && viewMode === "desktop" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2 bg-white/80 shadow-sm"
                  onClick={reloadIframe}
                >
                  <RefreshCcw className="h-3.5 w-3.5 mr-1" />
                  更新
                </Button>
              )}
            </div>
            <div className="p-3 bg-gray-50 border-t text-center">
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                プレビューに表示されない要素がある場合は「更新」ボタンを押すか、ダウンロードして実際のブラウザで確認してください。
              </p>
            </div>
          </TabsContent>

          {/* HTMLタブ */}
          <TabsContent value="html" className="mt-0">
            <div className="relative">
              <div className="absolute top-2 right-2 z-10">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 bg-white shadow-sm text-xs"
                  onClick={() => copyToClipboard(data.html, "HTML")}
                >
                  {copyStatus.html ? (
                    <>
                      <CheckCheck className="h-3.5 w-3.5 mr-1.5" />
                      コピー済み
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 mr-1.5" />
                      コピー
                    </>
                  )}
                </Button>
              </div>
              <div className="bg-gray-50 p-2 rounded-md m-2">
                <pre className="language-html overflow-auto text-xs p-3 border bg-white rounded-md shadow-sm max-h-[500px]">
                  <code>{data.html}</code>
                </pre>
              </div>
            </div>
          </TabsContent>

          {/* CSSタブ */}
          <TabsContent value="css" className="mt-0">
            <div className="relative">
              <div className="absolute top-2 right-2 z-10">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 bg-white shadow-sm text-xs"
                  onClick={() => copyToClipboard(data.css, "CSS")}
                >
                  {copyStatus.css ? (
                    <>
                      <CheckCheck className="h-3.5 w-3.5 mr-1.5" />
                      コピー済み
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 mr-1.5" />
                      コピー
                    </>
                  )}
                </Button>
              </div>
              <div className="bg-gray-50 p-2 rounded-md m-2">
                <pre className="language-css overflow-auto text-xs p-3 border bg-white rounded-md shadow-sm max-h-[500px]">
                  <code>{data.css}</code>
                </pre>
              </div>
            </div>
          </TabsContent>

          {/* JavaScriptタブ */}
          <TabsContent value="js" className="mt-0">
            <div className="relative">
              <div className="absolute top-2 right-2 z-10">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 bg-white shadow-sm text-xs"
                  onClick={() => copyToClipboard(data.js, "JavaScript")}
                >
                  {copyStatus.js ? (
                    <>
                      <CheckCheck className="h-3.5 w-3.5 mr-1.5" />
                      コピー済み
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 mr-1.5" />
                      コピー
                    </>
                  )}
                </Button>
              </div>
              <div className="bg-gray-50 p-2 rounded-md m-2">
                <pre className="language-javascript overflow-auto text-xs p-3 border bg-white rounded-md shadow-sm max-h-[500px]">
                  <code>{data.js}</code>
                </pre>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between border-t py-3 bg-gray-50">
        <div className="text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-1 rounded-full">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </div>
            AIにより生成されたコード
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onShare}>
            <Share2 className="h-3.5 w-3.5 mr-1.5" />
            共有
          </Button>
          <Button variant="default" size="sm" className="h-8 text-xs" onClick={onDownload}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            ダウンロード
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default LPPreview;
