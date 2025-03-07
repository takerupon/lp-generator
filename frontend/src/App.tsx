// App.tsx
import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

// shadcn/uiコンポーネントのインポート
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

// ジョブのステータスタイプ
type JobStatus = "idle" | "pending" | "processing" | "completed" | "error";

// ステップの型定義
interface Step {
  id: string;
  name: string;
  description: string;
  status: "pending" | "processing" | "completed" | "error";
  progress: number;
}

// ジョブ情報の型定義
interface JobInfo {
  jobId: string;
  status: JobStatus;
  progress: number;
  currentStep: string;
  steps: Step[];
  error?: string;
  result?: {
    html: string;
    css: string;
    js: string;
    imageUrls: string[];
    imageBase64: string;
  };
}

// フォームのスキーマ定義
const formSchema = z.object({
  serviceName: z.string().min(2, {
    message: "サービス名は2文字以上入力してください。",
  }),
  serviceType: z.string().min(2, {
    message: "サービスタイプは2文字以上入力してください。",
  }),
  targetAudience: z.string().min(2, {
    message: "ターゲット層は2文字以上入力してください。",
  }),
  features: z.string().min(10, {
    message: "特徴は10文字以上入力してください。",
  }),
  testimonials: z.string().min(10, {
    message: "お客様の声は10文字以上入力してください。",
  }),
  companyName: z.string().min(2, {
    message: "会社名は2文字以上入力してください。",
  }),
});

// APIに送信するデータの型
type FormData = z.infer<typeof formSchema>;

// プレビューのiframeを更新するための関数
const updateIframeContent = (
  iframe: HTMLIFrameElement,
  html: string,
  css: string,
  js: string,
  imageBase64: string
) => {
  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;

  if (iframeDoc) {
    // CSSの中の${imageBase64}プレースホルダーを実際の画像データで置き換え
    const updatedCss = css.replace("${imageBase64}", imageBase64);

    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>${updatedCss}</style>
        </head>
        <body>
          ${html}
          <script>${js}</script>
        </body>
      </html>
    `);
    iframeDoc.close();
  }
};

const App = () => {
  // 現在のジョブ情報の状態
  const [jobInfo, setJobInfo] = useState<JobInfo | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // フォームの状態管理
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serviceName: "EasySpeak",
      serviceType: "オンライン英会話スクール",
      targetAudience: "社会人向け",
      features: "24時間対応、パーソナルカリキュラム",
      testimonials: "講師情報、お客様の声",
      companyName: "株式会社アブソリュート",
    },
  });

  // フォーム送信ハンドラー
  const onSubmit = async (data: FormData) => {
    try {
      // APIを呼び出してジョブを開始
      const response = await fetch("http://localhost:8000/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("ジョブの開始に失敗しました");
      }

      const result = await response.json();
      const jobId = result.jobId;

      // 初期ジョブ情報を設定
      setJobInfo({
        jobId: jobId,
        status: "processing",
        progress: 10,
        currentStep: "wireframe",
        steps: [
          {
            id: "wireframe",
            name: "ワイヤーフレーム作成",
            description: "HTML構造の生成",
            status: "processing",
            progress: 50,
          },
          {
            id: "css",
            name: "デザイン適用",
            description: "CSSスタイルの生成",
            status: "pending",
            progress: 0,
          },
          {
            id: "js",
            name: "インタラクション追加",
            description: "JavaScript機能の実装",
            status: "pending",
            progress: 0,
          },
          {
            id: "image",
            name: "画像生成",
            description: "AIによる画像の生成",
            status: "pending",
            progress: 0,
          },
          {
            id: "apply-image",
            name: "画像適用",
            description: "生成された画像の適用",
            status: "pending",
            progress: 0,
          },
        ],
      });

      // ジョブステータスのポーリングを開始
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`http://localhost:8000/api/jobs/${jobId}`);
          if (!statusResponse.ok) {
            throw new Error("ジョブステータスの取得に失敗しました");
          }

          const jobStatus = await statusResponse.json();
          setJobInfo(jobStatus);

          // ジョブが完了またはエラーの場合、ポーリングを停止
          if (jobStatus.status === "completed" || jobStatus.status === "error") {
            clearInterval(pollInterval);

            // 完了時にプレビューを更新
            if (jobStatus.status === "completed" && jobStatus.result && iframeRef.current) {
              updateIframeContent(
                iframeRef.current,
                jobStatus.result.html,
                jobStatus.result.css,
                jobStatus.result.js,
                jobStatus.result.imageBase64
              );
            }
          }
        } catch (error) {
          console.error("Error polling job status:", error);
          clearInterval(pollInterval);
          setJobInfo((prev) =>
            prev
              ? {
                  ...prev,
                  status: "error",
                  error: "ジョブステータスの取得に失敗しました",
                }
              : null
          );
        }
      }, 3000); // 3秒ごとにポーリング
    } catch (error) {
      console.error("Error starting job:", error);
      setJobInfo({
        jobId: `error-${Date.now()}`,
        status: "error",
        progress: 0,
        currentStep: "",
        steps: [],
        error: "ジョブの開始に失敗しました。",
      });
    }
  };

  // ジョブのリセット - 新しいLP生成を開始できるようにする
  const resetJob = () => {
    setJobInfo(null);
  };

  // プレビューを更新
  useEffect(() => {
    if (jobInfo?.status === "completed" && jobInfo.result && iframeRef.current) {
      updateIframeContent(
        iframeRef.current,
        jobInfo.result.html,
        jobInfo.result.css,
        jobInfo.result.js,
        jobInfo.result.imageBase64
      );
    }
  }, [jobInfo?.result, jobInfo?.status]);

  // 日本語のステップ名を取得
  const getStepName = (stepId: string): string => {
    const stepMap: Record<string, string> = {
      wireframe: "ワイヤーフレーム作成",
      css: "デザイン適用",
      js: "インタラクション追加",
      image: "画像生成",
      "apply-image": "画像適用",
      completed: "完了",
    };

    return stepMap[stepId] || stepId;
  };

  return (
    <div className="bg-background">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 w-full border-b bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">LP</span>
            </span>
            <span className="text-xl font-bold">LPジェネレーター</span>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 py-6">
        <div className="container mx-[100px]">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* 左側: フォームと進捗状況 */}
            <div className="w-full space-y-6">
              {!jobInfo || jobInfo.status === "error" ? (
                // フォーム入力エリア
                <Card>
                  <CardHeader>
                    <CardTitle>LP情報入力</CardTitle>
                    <CardDescription>生成するLPに必要な情報を入力してください</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="serviceName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  サービス名 <span className="text-destructive">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Input placeholder="EasySpeak" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="serviceType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  サービスタイプ <span className="text-destructive">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Input placeholder="オンライン英会話スクール" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="targetAudience"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                ターゲット層 <span className="text-destructive">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="社会人向け" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="features"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                サービスの特徴 <span className="text-destructive">*</span>
                              </FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="24時間対応、パーソナルカリキュラム"
                                  rows={3}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="testimonials"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                お客様の声 <span className="text-destructive">*</span>
                              </FormLabel>
                              <FormControl>
                                <Textarea placeholder="講師情報、お客様の声" rows={3} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="companyName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                会社名 <span className="text-destructive">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="株式会社アブソリュート" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button type="submit" className="w-full" size="lg">
                          {form.formState.isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              生成中...
                            </>
                          ) : (
                            "ランディングページを生成"
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                  <CardFooter className="flex flex-col text-center text-sm text-muted-foreground">
                    <p>
                      入力された情報をもとにAIがHTMLコード、CSSデザイン、JSインタラクション、最適な画像を生成します。
                    </p>
                  </CardFooter>
                </Card>
              ) : (
                // 進捗状況エリア
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>生成状況</CardTitle>
                    <CardDescription>LPの生成状況をリアルタイムに表示</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* 進捗バー */}
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">
                            {jobInfo.currentStep ? getStepName(jobInfo.currentStep) : "待機中"}
                          </span>
                          <span className="text-sm text-muted-foreground">{jobInfo.progress}%</span>
                        </div>
                        <Progress value={jobInfo.progress} className="h-2" />
                      </div>

                      {/* ステップリスト */}
                      <div className="space-y-4">
                        {jobInfo.steps.map((step) => (
                          <div key={step.id} className="flex items-center gap-3">
                            {step.status === "pending" && (
                              <div className="h-8 w-8 rounded-full border-2 flex items-center justify-center">
                                <span className="text-xs text-muted-foreground">
                                  {jobInfo.steps.indexOf(step) + 1}
                                </span>
                              </div>
                            )}
                            {step.status === "processing" && (
                              <div className="h-8 w-8 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
                                <Loader2 className="h-4 w-4 text-primary animate-spin" />
                              </div>
                            )}
                            {step.status === "completed" && (
                              <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                                <CheckCircle className="h-4 w-4 text-white" />
                              </div>
                            )}
                            {step.status === "error" && (
                              <div className="h-8 w-8 rounded-full bg-destructive flex items-center justify-center">
                                <AlertCircle className="h-4 w-4 text-white" />
                              </div>
                            )}

                            <div className="flex-1">
                              <p className="font-medium">{step.name}</p>
                              <p className="text-sm text-muted-foreground">{step.description}</p>
                            </div>

                            {step.status === "processing" && (
                              <Badge variant="outline">処理中</Badge>
                            )}
                            {step.status === "completed" && (
                              <Badge
                                variant="outline"
                                className="bg-green-500/10 text-green-600 border-green-200"
                              >
                                完了
                              </Badge>
                            )}
                            {step.status === "error" && <Badge variant="destructive">エラー</Badge>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between items-center border-t pt-4">
                    <p className="text-sm text-muted-foreground">
                      {jobInfo.status === "completed"
                        ? "生成が完了しました！プレビューを確認できます。"
                        : "生成処理には数分かかる場合があります。"}
                    </p>

                    {jobInfo.status === "completed" && (
                      <Button variant="outline" onClick={resetJob}>
                        新規作成
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              )}
            </div>

            {/* 右側: サイトプレビュー */}
            <div className="w-[900px] sticky top-20">
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <CardTitle>LP プレビュー</CardTitle>
                  <CardDescription>生成されたランディングページのプレビュー</CardDescription>
                </CardHeader>
                <CardContent className="p-0 overflow-hidden">
                  <div className="relative bg-accent/20 h-[calc(100vh-16rem)] min-h-[600px] rounded-b-lg">
                    {!jobInfo || jobInfo.status === "idle" ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                        <p className="text-muted-foreground mb-2">
                          LPを生成するとここにプレビューが表示されます
                        </p>
                        <div className="mt-4 w-full max-w-md space-y-4">
                          <div className="h-8 bg-muted rounded w-full animate-pulse"></div>
                          <div className="h-32 bg-muted rounded w-full animate-pulse"></div>
                          <div className="h-24 bg-muted rounded w-full animate-pulse"></div>
                          <div className="h-24 bg-muted rounded w-full animate-pulse"></div>
                        </div>
                      </div>
                    ) : jobInfo.status === "processing" || jobInfo.status === "pending" ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                        <p className="text-muted-foreground mb-2">LPを生成中...</p>
                        <div className="w-full max-w-md mt-4 space-y-4">
                          <div className="h-8 bg-muted rounded w-full animate-pulse"></div>
                          <div className="h-32 bg-muted rounded w-full animate-pulse"></div>
                          <div className="h-24 bg-muted rounded w-full animate-pulse"></div>
                          <div className="h-24 bg-muted rounded w-full animate-pulse"></div>
                        </div>
                      </div>
                    ) : jobInfo.status === "error" ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                        <p className="text-destructive mb-2">エラーが発生しました</p>
                        <p className="text-muted-foreground">{jobInfo.error}</p>
                      </div>
                    ) : (
                      <iframe
                        ref={iframeRef}
                        title="LP Preview"
                        className="absolute inset-0 w-full h-full border-0 rounded-b-lg"
                        sandbox="allow-same-origin allow-scripts"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* フッター */}
      <footer className="w-full border-t py-4 bg-background mt-auto">
        <div className="container mx-auto flex justify-between items-center px-4">
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">LP</span>
            </span>
            <span className="text-sm font-semibold">LPジェネレーター</span>
          </div>

          <div className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
