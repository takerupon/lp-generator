import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { LPGenerationData } from "@/types";
import { Sparkles, HelpCircle, Lightbulb } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// バリデーションスキーマの定義
const formSchema = z.object({
  serviceName: z.string().min(2, {
    message: "サービス名は2文字以上で入力してください。",
  }),
  serviceType: z.string().min(2, {
    message: "サービスタイプは2文字以上で入力してください。",
  }),
  targetAudience: z.string().min(2, {
    message: "ターゲットは2文字以上で入力してください。",
  }),
  features: z.string().min(10, {
    message: "特徴は10文字以上で入力してください。",
  }),
  testimonials: z.string().min(10, {
    message: "お客様の声などは10文字以上で入力してください。",
  }),
  companyName: z.string().min(2, {
    message: "会社名は2文字以上で入力してください。",
  }),
});

// 親コンポーネントから受け取るプロップスの型定義
type LPInputFormProps = {
  onSubmit: (data: LPGenerationData) => void;
  isLoading: boolean;
};

// LPInputFormコンポーネント
const LPInputForm = ({ onSubmit, isLoading }: LPInputFormProps) => {
  const [activeTab, setActiveTab] = useState("basic");

  // フォームの状態管理
  const form = useForm<LPGenerationData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serviceName: "",
      serviceType: "",
      targetAudience: "",
      features: "",
      testimonials: "",
      companyName: "",
    },
  });

  // フォーム送信処理
  const handleSubmit = (values: LPGenerationData) => {
    try {
      onSubmit(values);
    } catch {
      toast.error("エラーが発生しました", {
        description: "フォームの送信中にエラーが発生しました。もう一度お試しください。",
      });
    }
  };

  // サンプルデータを設定する関数
  const setExampleData = () => {
    form.setValue("serviceName", "EasySpeak");
    form.setValue("serviceType", "オンライン英会話スクール");
    form.setValue("targetAudience", "社会人、学生");
    form.setValue(
      "features",
      "24時間対応、ネイティブ講師、パーソナルカリキュラム、リーズナブルな料金"
    );
    form.setValue("testimonials", "満足度98%、受講生の声、講師プロフィール");
    form.setValue("companyName", "株式会社グローバルトーク");

    toast.success("サンプルデータを設定しました", {
      description:
        "入力欄にサンプルデータを設定しました。これをそのまま使用するか、編集してください。",
    });
  };

  const isFormComplete = () => {
    const values = form.getValues();
    return (
      values.serviceName.length >= 2 &&
      values.serviceType.length >= 2 &&
      values.targetAudience.length >= 2 &&
      values.features.length >= 10 &&
      values.testimonials.length >= 10 &&
      values.companyName.length >= 2
    );
  };

  const formProgress = () => {
    const values = form.getValues();
    const fields = [
      values.serviceName.length >= 2,
      values.serviceType.length >= 2,
      values.targetAudience.length >= 2,
      values.features.length >= 10,
      values.testimonials.length >= 10,
      values.companyName.length >= 2,
    ];

    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  };

  const TooltipHelp = ({ content }: { content: string }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="h-4 w-4 text-muted-foreground ml-1.5 cursor-help" />
        </TooltipTrigger>
        <TooltipContent className="max-w-[300px] text-xs">{content}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <Card className="w-full mx-auto shadow-lg border border-gray-100 overflow-hidden bg-white">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b relative pb-4">
        <div className="absolute inset-0 bg-grid-primary/10 mask-fade"></div>
        <div className="relative">
          <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-2 md:gap-0">
            <div>
              <CardTitle className="text-xl flex items-center">
                LP情報入力
                <span className="inline-flex items-center text-xs ml-3 bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                  完成度: {formProgress()}%
                </span>
              </CardTitle>
              <CardDescription className="mt-1">
                以下の情報を入力して、AIによるランディングページを生成します。
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={setExampleData}
                type="button"
                className="text-xs h-8 shadow-sm"
              >
                <Lightbulb className="h-3.5 w-3.5 mr-1.5" />
                サンプルを入力
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="px-4 pt-4 border-b">
                <TabsList className="grid grid-cols-2 w-full bg-muted/70">
                  <TabsTrigger value="basic" className="data-[state=active]:bg-white">
                    基本情報
                  </TabsTrigger>
                  <TabsTrigger value="details" className="data-[state=active]:bg-white">
                    詳細情報
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="px-6 py-4">
                <TabsContent value="basic" className="mt-0 space-y-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="serviceName"
                        render={({ field }) => (
                          <FormItem className="space-y-1.5">
                            <FormLabel className="flex items-center text-sm font-medium">
                              <span className="bg-primary/90 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                                1
                              </span>
                              サービス名
                              <TooltipHelp content="提供するサービスやプロダクトの名前を入力してください。短く覚えやすい名前が効果的です。" />
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="例: EasySpeak"
                                {...field}
                                className="focus-visible:ring-primary"
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="serviceType"
                        render={({ field }) => (
                          <FormItem className="space-y-1.5">
                            <FormLabel className="flex items-center text-sm font-medium">
                              <span className="bg-primary/90 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                                2
                              </span>
                              サービスタイプ
                              <TooltipHelp content="サービスのカテゴリやタイプを入力してください。例：「オンライン英会話」「健康食品」「コンサルティングサービス」など" />
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="例: オンライン英会話スクール"
                                {...field}
                                className="focus-visible:ring-primary"
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="targetAudience"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="flex items-center text-sm font-medium">
                            <span className="bg-primary/90 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                              3
                            </span>
                            ターゲット層
                            <TooltipHelp content="このサービスが主に向けられている対象者を入力してください。年齢層、職業、興味関心などを具体的に記述するとより効果的です。" />
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="例: 20〜40代の社会人、英語初心者の学生"
                              {...field}
                              className="focus-visible:ring-primary"
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end mt-4">
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={() => setActiveTab("details")}
                      className="gap-1.5"
                    >
                      次へ
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 15 15"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M8.14645 3.14645C8.34171 2.95118 8.65829 2.95118 8.85355 3.14645L12.8536 7.14645C13.0488 7.34171 13.0488 7.65829 12.8536 7.85355L8.85355 11.8536C8.65829 12.0488 8.34171 12.0488 8.14645 11.8536C7.95118 11.6583 7.95118 11.3417 8.14645 11.1464L11.2929 8H2.5C2.22386 8 2 7.77614 2 7.5C2 7.22386 2.22386 7 2.5 7H11.2929L8.14645 3.85355C7.95118 3.65829 7.95118 3.34171 8.14645 3.14645Z"
                          fill="currentColor"
                          fillRule="evenodd"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="details" className="mt-0 space-y-4">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="features"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="flex items-center text-sm font-medium">
                            <span className="bg-primary/90 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                              4
                            </span>
                            サービスの特徴
                            <TooltipHelp content="サービスの主な特徴やメリットを箇条書きで入力してください。「カンマ」または「、」で区切ってください。" />
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="例: 24時間対応、ネイティブ講師、パーソナルカリキュラム、リーズナブルな料金"
                              {...field}
                              rows={3}
                              className="resize-none focus-visible:ring-primary"
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            カンマ区切りで入力してください（例: 特徴1, 特徴2, 特徴3）
                          </FormDescription>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="testimonials"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="flex items-center text-sm font-medium">
                            <span className="bg-primary/90 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                              5
                            </span>
                            社会的証明・実績
                            <TooltipHelp content="お客様の声や実績、導入事例などを入力してください。「カンマ」または「、」で区切ってください。" />
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="例: 満足度98%、導入企業500社以上、業界シェアNo.1"
                              {...field}
                              rows={3}
                              className="resize-none focus-visible:ring-primary"
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            カンマ区切りで入力してください（例: 実績1, 実績2, 実績3）
                          </FormDescription>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="flex items-center text-sm font-medium">
                            <span className="bg-primary/90 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                              6
                            </span>
                            会社名
                            <TooltipHelp content="サービスを提供する会社や組織の名前を入力してください。" />
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="例: 株式会社グローバルトーク"
                              {...field}
                              className="focus-visible:ring-primary"
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-between mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab("basic")}
                      className="gap-1.5"
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 15 15"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M6.85355 3.14645C7.04882 3.34171 7.04882 3.65829 6.85355 3.85355L3.70711 7H12.5C12.7761 7 13 7.22386 13 7.5C13 7.77614 12.7761 8 12.5 8H3.70711L6.85355 11.1464C7.04882 11.3417 7.04882 11.6583 6.85355 11.8536C6.65829 12.0488 6.34171 12.0488 6.14645 11.8536L2.14645 7.85355C1.95118 7.65829 1.95118 7.34171 2.14645 7.14645L6.14645 3.14645C6.34171 2.95118 6.65829 2.95118 6.85355 3.14645Z"
                          fill="currentColor"
                          fillRule="evenodd"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                      戻る
                    </Button>
                    <Button
                      disabled={isLoading || !isFormComplete()}
                      className="gap-2 shadow-md relative overflow-hidden"
                      size="sm"
                      type="submit"
                    >
                      {isLoading ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          生成中...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          LPを生成する
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default LPInputForm;
