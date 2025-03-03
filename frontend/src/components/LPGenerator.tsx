import { useState } from "react";
import LPInputForm from "./LPInputForm";
import GenerationProgress from "./GenerationProgress";
import LPPreview from "./LPPreview";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { LPGenerationData, LPData, GenerationState, GenerationStep, JobStatus } from "@/types";

const LPGenerator = () => {
  // ステート
  const [generationState, setGenerationState] = useState<GenerationState>("idle");
  const [jobId, setJobId] = useState<string | null>(null);

  const [, setJobStatus] = useState<JobStatus | null>(null); // 将来的な拡張のために保持
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [lpData, setLpData] = useState<LPData | null>(null);
  const [steps, setSteps] = useState<GenerationStep[]>([
    {
      id: "wireframe",
      name: "ワイヤーフレーム作成",
      description: "HTML構造の生成",
      status: "pending",
      progress: 0,
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
  ]);

  // ジョブの状態をポーリングで更新する
  const startPolling = (id: string) => {
    if (isPolling) return;

    setIsPolling(true);

    // インターバルIDを変数に格納
    // eslint-disable-next-line prefer-const
    let intervalId: NodeJS.Timeout;

    const poll = async () => {
      try {
        const status = await api.getJobStatus(id);
        setJobStatus(status);

        // ステップの状態を更新
        if (status.steps) {
          setSteps(status.steps);
        }

        // ジョブの状態に基づいて画面状態を更新
        if (status.status === "completed") {
          setGenerationState("completed");
          setLpData(status.result || null);
          clearInterval(intervalId);
          setIsPolling(false);
        } else if (status.status === "error") {
          setGenerationState("error");
          setError(status.error || "不明なエラーが発生しました");
          clearInterval(intervalId);
          setIsPolling(false);
        }
      } catch (error) {
        console.error("Polling error:", error);
        // エラーが発生した場合でもポーリングは継続
      }
    };

    // 初回のポーリングを即時実行
    poll();

    // その後、定期的にポーリング
    intervalId = setInterval(poll, 3000);

    // コンポーネントのクリーンアップ時にポーリングを停止
    return () => {
      clearInterval(intervalId);
      setIsPolling(false);
    };
  };

  // フォーム送信ハンドラ
  const handleFormSubmit = async (data: LPGenerationData) => {
    try {
      setGenerationState("submitting");
      setError(null);

      // LPジェネレーションジョブを開始
      const response = await api.startGeneration(data);

      // ジョブIDを設定
      setJobId(response.jobId);

      // ポーリングを開始
      setGenerationState("processing");
      startPolling(response.jobId);

      toast.success("生成を開始しました", {
        description: `ジョブID: ${response.jobId}`,
      });
    } catch (error) {
      console.error("Submit error:", error);
      setGenerationState("error");
      setError(error instanceof Error ? error.message : "不明なエラーが発生しました");

      toast.error("エラーが発生しました", {
        description: error instanceof Error ? error.message : "不明なエラーが発生しました",
      });
    }
  };

  // 再試行ハンドラ
  const handleRetry = async () => {
    if (!jobId) return;

    try {
      setGenerationState("submitting");
      setError(null);

      // ジョブを再実行
      const response = await api.retryJob(jobId);

      // 新しいジョブIDを設定
      setJobId(response.jobId);

      // ポーリングを開始
      setGenerationState("processing");
      startPolling(response.jobId);

      toast.success("再生成を開始しました", {
        description: `新しいジョブID: ${response.jobId}`,
      });
    } catch (error) {
      console.error("Retry error:", error);
      setGenerationState("error");
      setError(error instanceof Error ? error.message : "再試行中にエラーが発生しました");

      toast.error("再試行エラー", {
        description: error instanceof Error ? error.message : "再試行中にエラーが発生しました",
      });
    }
  };

  // ダウンロードハンドラ
  const handleDownload = async () => {
    if (!jobId) return;

    try {
      const blob = await api.downloadResults(jobId);

      // ダウンロードリンクを作成
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lp-${jobId}.zip`;
      document.body.appendChild(a);
      a.click();

      // クリーンアップ
      URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("ダウンロードしました", {
        description: "ランディングページのファイルをダウンロードしました。",
      });
    } catch (error) {
      console.error("Download error:", error);

      toast.error("ダウンロードエラー", {
        description: "ファイルのダウンロード中にエラーが発生しました。",
      });
    }
  };

  // 共有ハンドラ
  const handleShare = () => {
    // 現在のURLをクリップボードにコピー
    const url = window.location.href;

    navigator.clipboard.writeText(url).then(
      () => {
        toast.success("URLをコピーしました", {
          description: "ランディングページの共有URLをクリップボードにコピーしました。",
        });
      },
      () => {
        toast.error("コピーに失敗しました", {
          description: "URLのコピーに失敗しました。もう一度お試しください。",
        });
      }
    );
  };

  // 新規作成に戻るハンドラ
  const handleBackToNew = () => {
    setGenerationState("idle");
    setJobId(null);
    setJobStatus(null);
    setError(null);
    setLpData(null);

    // ステップをリセット
    setSteps([
      {
        id: "wireframe",
        name: "ワイヤーフレーム作成",
        description: "HTML構造の生成",
        status: "pending",
        progress: 0,
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
    ]);
  };

  // 現在のステップインデックスを計算
  const getCurrentStepIndex = (): number => {
    if (!steps) return 0;

    const processingIndex = steps.findIndex((step) => step.status === "processing");
    if (processingIndex !== -1) return processingIndex;

    // 処理中のステップがない場合は、最後の完了したステップの次のステップを返す
    const lastCompletedIndex = [...steps]
      .reverse()
      .findIndex((step) => step.status === "completed");
    if (lastCompletedIndex !== -1) {
      return steps.length - 1 - lastCompletedIndex + 1;
    }

    return 0;
  };

  // 全体の進捗状況を計算
  const calculateOverallProgress = (): number => {
    if (!steps) return 0;

    const totalSteps = steps.length;
    const completedSteps = steps.filter((step) => step.status === "completed").length;
    const processingStep = steps.find((step) => step.status === "processing");

    // 完了したステップの割合を計算
    let progress = (completedSteps / totalSteps) * 100;

    // 処理中のステップがある場合、その進捗も加える
    if (processingStep) {
      const stepProgress = (processingStep.progress / 100) * (1 / totalSteps) * 100;
      progress += stepProgress;
    }

    return progress;
  };

  // レンダリング関数を改善
  const renderContent = () => {
    switch (generationState) {
      case "idle":
        return <LPInputForm onSubmit={handleFormSubmit} isLoading={false} />;

      case "submitting":
        return <LPInputForm onSubmit={handleFormSubmit} isLoading={true} />;

      case "processing":
        return (
          <div className="w-full max-w-4xl mx-auto">
            <GenerationProgress
              jobId={jobId}
              steps={steps}
              currentStepIndex={getCurrentStepIndex()}
              overallProgress={calculateOverallProgress()}
              error={error}
              onRetry={handleRetry}
            />
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                生成には数分かかることがあります。このページを閉じずにお待ちください。
              </p>
            </div>
          </div>
        );

      case "completed":
        if (!lpData) {
          return (
            <div className="text-center py-8">
              <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 mx-auto max-w-md">
                <h3 className="text-yellow-800 font-medium">データ不足</h3>
                <p className="text-yellow-700 text-sm mt-1">
                  LP データが取得できませんでした。もう一度お試しください。
                </p>
                <Button variant="outline" onClick={handleBackToNew} className="mt-4 text-sm">
                  最初からやり直す
                </Button>
              </div>
            </div>
          );
        }

        return (
          <div className="w-full mx-auto space-y-6">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-sm border p-3 flex-1 text-center">
                <h3 className="text-sm font-medium text-muted-foreground">ジョブID</h3>
                <p className="text-sm mt-1 font-mono bg-gray-50 py-1 rounded">{jobId}</p>
              </div>
              <div className="flex gap-2 justify-center md:justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBackToNew}
                  className="h-10 px-3 text-xs"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 15 15"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="mr-1.5 h-4 w-4"
                  >
                    <path
                      d="M1.5 1.5C1.5 1.22386 1.72386 1 2 1H7C7.27614 1 7.5 1.22386 7.5 1.5C7.5 1.77614 7.27614 2 7 2H2.5V13H7C7.27614 13 7.5 13.2239 7.5 13.5C7.5 13.7761 7.27614 14 7 14H2C1.72386 14 1.5 13.7761 1.5 13.5V1.5ZM10.1464 4.14645C10.3417 3.95118 10.6583 3.95118 10.8536 4.14645L13.8536 7.14645C14.0488 7.34171 14.0488 7.65829 13.8536 7.85355L10.8536 10.8536C10.6583 11.0488 10.3417 11.0488 10.1464 10.8536C9.95118 10.6583 9.95118 10.3417 10.1464 10.1464L12.2929 8H5.5C5.22386 8 5 7.77614 5 7.5C5 7.22386 5.22386 7 5.5 7H12.2929L10.1464 4.85355C9.95118 4.65829 9.95118 4.34171 10.1464 4.14645Z"
                      fill="currentColor"
                      fillRule="evenodd"
                      clipRule="evenodd"
                    />
                  </svg>
                  新規作成
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="h-10 px-3 text-xs"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 15 15"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="mr-1.5 h-4 w-4"
                  >
                    <path
                      d="M3.5 5.5C3.5 3.84315 4.84315 2.5 6.5 2.5C8.15685 2.5 9.5 3.84315 9.5 5.5C9.5 7.15685 8.15685 8.5 6.5 8.5C4.84315 8.5 3.5 7.15685 3.5 5.5ZM6.5 3.5C5.39543 3.5 4.5 4.39543 4.5 5.5C4.5 6.60457 5.39543 7.5 6.5 7.5C7.60457 7.5 8.5 6.60457 8.5 5.5C8.5 4.39543 7.60457 3.5 6.5 3.5ZM10 2.5C9.44772 2.5 9 2.94772 9 3.5C9 4.05228 9.44772 4.5 10 4.5C10.5523 4.5 11 4.05228 11 3.5C11 2.94772 10.5523 2.5 10 2.5ZM2.5 10C2.5 9.44772 2.94772 9 3.5 9C4.05228 9 4.5 9.44772 4.5 10C4.5 10.5523 4.05228 11 3.5 11C2.94772 11 2.5 10.5523 2.5 10ZM11.5 10C11.5 9.44772 11.9477 9 12.5 9C13.0523 9 13.5 9.44772 13.5 10C13.5 10.5523 13.0523 11 12.5 11C11.9477 11 11.5 10.5523 11.5 10ZM4.24407 13.5C4.64284 13.5 4.96181 13.2681 5.04657 12.9223C5.43158 11.4583 6.80369 10.5 8.33333 10.5H8.42749L7.21922 11.4583C6.92969 11.6903 6.87256 12.1042 7.10458 12.3937C7.3366 12.6833 7.75287 12.7404 8.0424 12.5084L10.7105 10.3417C10.8931 10.1962 11 9.9792 11 9.75C11 9.5208 10.8931 9.30378 10.7105 9.15833L8.0424 6.99167C7.75287 6.75966 7.3366 6.81679 7.10458 7.10632C6.87256 7.39584 6.92969 7.80979 7.21922 8.04167L8.42749 9H8.33333C6.10243 9 4.19559 10.5569 3.60677 12.7L3.59553 12.75C3.50943 13.1815 3.8452 13.5 4.24407 13.5Z"
                      fill="currentColor"
                      fillRule="evenodd"
                      clipRule="evenodd"
                    />
                  </svg>
                  共有する
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleDownload}
                  className="h-10 px-3 text-xs bg-green-600 hover:bg-green-700"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 15 15"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="mr-1.5 h-4 w-4"
                  >
                    <path
                      d="M7.5 1C7.22386 1 7 1.22386 7 1.5V10.2929L4.85355 8.14645C4.65829 7.95118 4.34171 7.95118 4.14645 8.14645C3.95118 8.34171 3.95118 8.65829 4.14645 8.85355L7.14645 11.8536C7.34171 12.0488 7.65829 12.0488 7.85355 11.8536L10.8536 8.85355C11.0488 8.65829 11.0488 8.34171 10.8536 8.14645C10.6583 7.95118 10.3417 7.95118 10.1464 8.14645L8 10.2929V1.5C8 1.22386 7.77614 1 7.5 1ZM2.5 12C2.77614 12 3 12.2239 3 12.5V13H12V12.5C12 12.2239 12.2239 12 12.5 12C12.7761 12 13 12.2239 13 12.5V13.5C13 13.7761 12.7761 14 12.5 14H2.5C2.22386 14 2 13.7761 2 13.5V12.5C2 12.2239 2.22386 12 2.5 12Z"
                      fill="currentColor"
                      fillRule="evenodd"
                      clipRule="evenodd"
                    />
                  </svg>
                  ダウンロード
                </Button>
              </div>
            </div>

            <LPPreview data={lpData} onDownload={handleDownload} onShare={handleShare} />
          </div>
        );

      case "error":
        return (
          <div className="max-w-2xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <div className="flex flex-col items-center">
                <div className="rounded-full bg-red-100 p-3 mb-4">
                  <svg
                    className="h-6 w-6 text-red-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-red-800 mb-2">エラーが発生しました</h3>
                <p className="text-red-700 mb-4 max-w-md">
                  {error || "不明なエラーが発生しました"}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 mt-2">
                  <Button variant="outline" onClick={handleBackToNew} size="sm">
                    最初からやり直す
                  </Button>
                  {jobId && (
                    <Button variant="default" onClick={handleRetry} size="sm">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      再試行する
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-8 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
              ランディングページジェネレーター
            </h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              AIを使用して、ニーズに合わせたランディングページを簡単に生成します。
              必要な情報を入力するだけで、魅力的なWebページが数分で完成します。
            </p>
          </div>
          {(generationState === "completed" || generationState === "error") && (
            <Button
              onClick={handleBackToNew}
              variant="outline"
              size="sm"
              className="flex items-center gap-1 hover:bg-primary/5 transition-colors"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="mr-1"
              >
                <path
                  d="M12 4V20M4 12H20"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>新規作成</span>
            </Button>
          )}
        </div>
      </div>

      <div className="transition-all duration-300 ease-in-out">{renderContent()}</div>

      {/* ヘルプセクション */}
      {generationState === "idle" && (
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="bg-blue-50 text-blue-500 p-2 rounded-full w-10 h-10 flex items-center justify-center mb-4">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2">短時間で作成</h3>
            <p className="text-sm text-muted-foreground">
              最短5分でプロ品質のランディングページを生成できます。
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="bg-violet-50 text-violet-500 p-2 rounded-full w-10 h-10 flex items-center justify-center mb-4">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15 15L21 21M10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10C17 13.866 13.866 17 10 17Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2">ニーズに合わせたデザイン</h3>
            <p className="text-sm text-muted-foreground">
              あなたのサービスに最適化されたデザインを自動生成します。
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="bg-emerald-50 text-emerald-500 p-2 rounded-full w-10 h-10 flex items-center justify-center mb-4">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 12L11 14L15 10M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2">すぐに利用可能</h3>
            <p className="text-sm text-muted-foreground">
              生成されたコードはすぐにダウンロードして利用できます。
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LPGenerator;
