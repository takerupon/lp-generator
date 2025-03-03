import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Check, Loader2, RefreshCw, AlertTriangle, BarChart } from "lucide-react";
import { GenerationStep } from "@/types";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// コンポーネントのプロップスの型定義
type GenerationProgressProps = {
  jobId: string | null;
  steps: GenerationStep[];
  currentStepIndex: number;
  overallProgress: number;
  error: string | null;
  onRetry?: () => void;
};

const GenerationProgress = ({
  jobId,
  steps,
  overallProgress,
  error,
  onRetry,
}: GenerationProgressProps) => {
  // プログレスバーのアニメーション用の状態
  const [animatedProgress, setAnimatedProgress] = useState(0);

  // 進捗状況の値を徐々に増やすアニメーション
  useEffect(() => {
    // 進捗状況の現在値と目標値の差が1%未満なら直接設定
    if (Math.abs(animatedProgress - overallProgress) < 1) {
      setAnimatedProgress(overallProgress);
      return;
    }

    // そうでなければアニメーションで徐々に増加
    const timeout = setTimeout(() => {
      setAnimatedProgress((prev) => {
        const next = prev + (overallProgress - prev) * 0.1;
        return Math.min(next, overallProgress);
      });
    }, 50);

    return () => clearTimeout(timeout);
  }, [overallProgress, animatedProgress]);

  // 進捗状況のテキスト（段階によって変化）
  const getProgressText = () => {
    if (overallProgress < 20) return "準備中...";
    if (overallProgress < 40) return "データを解析中...";
    if (overallProgress < 60) return "コードを生成中...";
    if (overallProgress < 80) return "スタイルを適用中...";
    if (overallProgress < 95) return "仕上げ中...";
    return "もうすぐ完成します！";
  };

  // 残り時間を推定
  const getEstimatedTime = () => {
    if (overallProgress < 1) return "約3〜5分";
    if (overallProgress < 20) return "約3〜4分";
    if (overallProgress < 40) return "約2〜3分";
    if (overallProgress < 60) return "約1〜2分";
    if (overallProgress < 80) return "約1分以内";
    if (overallProgress < 95) return "もうすぐ完了";
    return "数秒以内";
  };

  return (
    <Card className="w-full mx-auto shadow-lg border border-gray-100 overflow-hidden bg-white">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b relative py-4">
        <div className="absolute inset-0 bg-grid-primary/20 mask-fade"></div>
        <div className="relative">
          <CardTitle className="flex items-center justify-between flex-col sm:flex-row gap-2 sm:gap-0">
            <span className="flex items-center text-blue-800">
              <Loader2 className="h-4 w-4 mr-2 animate-spin text-blue-600" />
              ランディングページ生成中
            </span>
            {jobId && (
              <span className="text-xs font-normal text-muted-foreground bg-background/80 px-2 py-0.5 rounded-md border">
                ジョブID: {jobId}
              </span>
            )}
          </CardTitle>
          <CardDescription className="mt-2">
            AIがランディングページを生成しています。完成まで{getEstimatedTime()}ほどかかります。
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-6">
        {/* 全体の進捗状況 */}
        <div className="space-y-2.5">
          <div className="flex justify-between text-sm mb-1 items-center">
            <span className="font-medium text-primary">{getProgressText()}</span>
            <div className="flex items-center">
              <span className="font-medium">{Math.round(animatedProgress)}%</span>
              <BarChart className="w-4 h-4 ml-1.5 text-primary/70" />
            </div>
          </div>
          <Progress value={animatedProgress} className="h-2.5 bg-gray-100" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>推定残り時間: {getEstimatedTime()}</span>
            <span className="italic">ブラウザを閉じないでください</span>
          </div>
        </div>

        {/* 各ステップの状態 */}
        <div className="space-y-4 bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <span className="bg-primary/10 p-1.5 rounded">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-primary"
              >
                <path
                  d="M9 6L20 6M9 12H20M9 18H20M5 6V6.01M5 12V12.01M5 18V18.01"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            処理ステップ
          </h4>
          <div className="space-y-3">
            {steps.map((step) => {
              // ステップの状態に応じたアイコン、クラス、アニメーションを決定
              let icon;
              let textClass = "";
              let borderClass = "border-gray-200";
              let bgClass = "bg-white";

              if (step.status === "completed") {
                icon = <Check className="h-4 w-4 text-green-500" />;
                textClass = "text-green-700";
                borderClass = "border-green-200";
                bgClass = "bg-green-50";
              } else if (step.status === "processing") {
                icon = <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
                textClass = "text-blue-700 font-medium";
                borderClass = "border-blue-200";
                bgClass = "bg-blue-50";
              } else if (step.status === "error") {
                icon = <AlertTriangle className="h-4 w-4 text-red-500" />;
                textClass = "text-red-700";
                borderClass = "border-red-200";
                bgClass = "bg-red-50";
              }

              return (
                <div
                  key={step.id}
                  className={cn(
                    `relative flex p-2.5 rounded-lg border ${borderClass} ${bgClass} transition-all duration-300`,
                    step.status === "processing" ? "shadow-sm" : ""
                  )}
                >
                  <div className="mt-0.5 flex-shrink-0 mr-2.5">{icon}</div>
                  <div className="space-y-0.5 flex-1">
                    <p className={`text-xs font-medium ${textClass}`}>{step.name}</p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                    {step.status === "processing" && (
                      <Progress value={step.progress} className="h-1.5 mt-1.5 bg-blue-100" />
                    )}
                  </div>
                  {step.status === "processing" && (
                    <span className="absolute top-2 right-2 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-medium">
                      {step.progress}%
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div className="p-3 sm:p-4 bg-red-50 border border-red-100 text-red-800 rounded-lg space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">エラーが発生しました</p>
                <p className="text-xs mt-1">{error}</p>
              </div>
            </div>
            {onRetry && (
              <Button
                onClick={onRetry}
                variant="destructive"
                size="sm"
                className="mt-2 bg-red-100 text-red-700 hover:bg-red-200 border-none shadow-none w-full"
              >
                <RefreshCw className="h-3 w-3 mr-2" /> 再試行する
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GenerationProgress;
