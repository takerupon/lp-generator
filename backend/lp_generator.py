import os
import google.generativeai as genai
import json
import re
import ray
from collections import defaultdict
from PIL import Image
from io import BytesIO
import time
from dotenv import load_dotenv

# 環境変数の読み込み
load_dotenv()

######################################
## AIモデル選択
######################################

## geminiを使う場合
import google.generativeai as genai_img
from google.generativeai import types
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
generation_config = {
    "temperature": 1,
    "top_p": 0.95,
    "top_k": 64,
    "max_output_tokens": 8192,
    "response_mime_type": "text/plain",
}

## claudeを使う場合
import anthropic
client = anthropic.Anthropic(
    api_key=os.environ.get("ANTHROPIC_API_KEY")
)
def claude(system_prompt, prompt):
    message = client.messages.create(
        # model = "claude-3-5-sonnet-20241022",
        model = "claude-3-7-sonnet-20250219",
        max_tokens = 8192,
        temperature = 1,
        system = system_prompt,
        messages = [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": prompt
                    }
                ]
            }
        ]
    )
    # print(message.content[0].text)
    return message.content[0].text


######################################
## 補助関数
######################################

def safe_json_loads(text):
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\n", "", text)
        text = re.sub(r"\n```$", "", text)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        json_match = re.search(r'(\{.*\})', text, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(1))
            except json.JSONDecodeError as e:
                raise Exception("抽出した JSON のデコードに失敗しました") from e
        else:
            raise Exception("テキスト内に有効な JSON が見つかりませんでした")

## Markdown のコードブロック（```html）からHTMLコード部分を抽出する
def extract_html_code(text):
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:html)?\n", "", text, flags=re.IGNORECASE)  # 大文字小文字を区別しない
        text = re.sub(r"\n```$", "", text)
        return text.strip()
    return None

## Markdown のコードブロック（```css）からCSSコード部分を抽出する
def extract_css_code(text):
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:css)?\n", "", text, flags=re.IGNORECASE)  # 大文字小文字を区別しない
        text = re.sub(r"\n```$", "", text)
        return text.strip()
    return text

## Markdown のコードブロック（```js）からjsコード部分を抽出する
def extract_js_code(text):
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:javascript)?\n", "", text, flags=re.IGNORECASE)  # 大文字小文字を区別しない
        text = re.sub(r"\n```$", "", text)
        return text.strip()
    return text

## テキストデータ内のHTMLコードとCSSコードを区別する
def extract_code_blocks_by_type(text):
    pattern = r'```(\w+)\n(.*?)\n```'
    matches = re.finditer(pattern, text, re.DOTALL)
    
    code_dict = defaultdict(list)
    for match in matches:
        lang, code = match.groups()
        code_dict[lang].append(code.strip())

    html_code = "\n".join(code_dict.get("html", []))
    css_code = "\n".join(code_dict.get("css", []))

    return html_code, css_code

## ファイルに書き込む
def save_to_file(html_content, file_name):
    try:
        with open(file_name, "w", encoding="utf-8") as f:
            f.write(html_content)
        print(f"{file_name}にコンテンツを保存しました。")
    except Exception as e:
        print(html_content)
        print(f"エラーが発生しました: {e}")

## APIを使って画像生成するコード
@ray.remote
def generate_image_by_imagen3(prompt, file_name, aspect_ratio=None):
    # APIクライアントの初期化
    client = genai_img.Client(api_key=os.environ.get("GOOGLE_IMAGEN_API_KEY"))
    
    # ファイル名に基づいてアスペクト比を決定
    if aspect_ratio is None:
        if 'html' in file_name.lower():
            aspect_ratio = '1:1'
        elif 'css' in file_name.lower():
            aspect_ratio = '16:9'
        else:
            aspect_ratio = '1:1'  # デフォルト値

    # 生成設定
    config = types.GenerateImagesConfig(
        number_of_images=1,
        aspect_ratio=aspect_ratio
    )
    
    # 画像生成
    response = client.models.generate_images(
        model='imagen-3.0-generate-002',
        prompt=prompt,
        config=config
    )
    
    # 画像の保存
    image = Image.open(BytesIO(response.generated_images[0].image.image_bytes))
    image.save(file_name)
    print(f"画像を保存しました: {file_name}")
    return file_name


######################################
## エージェント関数
######################################

## ワイヤーフレーム作成エージェント
def wireframe_generate_agent(section_idea):
    print("\n===ワイヤーフレーム作成エージェント===")
    print("【ClaudeでHTMLを作成しています．．．】")
    
    system_prompt = (
"""あなたは、ランディングページ（LP）のワイヤーフレーム作成に特化したエージェントです。

**タスク:**

与えられたLPの構成案を基に、HTMLでワイヤーフレームを作成してください。

**入力:**

LPの構成案が与えられます。

**出力:**

*   htmlコードのみを出力としてください。
*   CSSやJavaScriptによるデザインコードはここでは含めず、後に追加することを想定してください。
*   ヘッダーとフッターは、必ず含めてください。
*   画像は含めないように想定してください。
*   '<body>'タグの最下部に、以下のコードを含めてください。これにより、アイコンが使えるようになるので、適切に使用してください。
    <script>
            lucide.createIcons();
    </script>
*   '<head>タグ内部には、<link rel="stylesheet" href="style.css">を含めてください。
*   `<body>`タグの最下部には、<script src="script.js"></script>を含めてください。
"""
    )
    response = claude(system_prompt, str(section_idea))
    data = extract_html_code(response)

    ## htmlファイルとして保存
    save_to_file(data, "index.html")

    return data

## デザイン提案エージェント（CSS）
def design_css_agent(html_data):
    print("\n===デザイン提案エージェント（CSS）===")

    print("【claudeでCSSを作成しています．．．】")
    system_prompt = (
"""あなたは、HTMLで構築されたランディングページ（LP）にCSSでデザインを提案するエージェントです。

**タスク:**

与えられたHTMLに対して、魅力的なLPとなるようにCSSコードでデザインを提案してください。

**入力:**

*   セクション構成が既に構築されたHTMLが与えられます。

**出力:**

*   厳密なCSSコードのみを出力してください。余分な説明文を含めないでください。
*   デザイン性を重視してください。
"""    
    )
    response = claude(system_prompt, html_data)
    data = extract_css_code(response)

    ## cssファイルとして保存
    save_to_file(data, "style.css")

    return data

## デザイン提案エージェント（JS）
def design_js_agent(html_data, css_data):
    print("\n===デザイン提案エージェント（JS）===")
    print("【claudeでJSを作成しています．．．】")
    system_prompt = (
"""あなたは、HTMLで構築されたランディングページ（LP）にJavaScriptを用いて動的なデザイン要素を追加するエージェントです。

**タスク:**

与えられたHTMLに対して、ユーザーエクスペリエンスを向上させるためのJavaScriptコードを提案してください。

**入力:**

*   セクション構成が既に構築されたHTMLコードと、CSSコードが与えられます。

**出力:**

*   厳密なJavaScriptコードのみを出力してください。
*   デザイン性を重視して、ユーザーエクスペリエンスの向上を目指してください。"""

    )
    prompt = (
        "**HTML**:"
        f"{html_data}"
        ""
        "**CSS**:"
        f"{css_data}"
    )
    response = claude(system_prompt, prompt)
    data = extract_js_code(response)

    ## cssファイルとして保存
    save_to_file(data, "script.js")

    return data

## 画像を作成するエージェント
def image_generate_agent(prompt):
    print("\n===画像を作成するエージェント===")
    
    ## まずは必要な画像の情報を取得する
    model = genai.GenerativeModel(
        # model_name = "gemini-2.0-pro-exp-02-05",
        model_name = "gemini-2.0-flash",
        generation_config = generation_config,
        system_instruction = (
            "あなたは、画像生成のプロンプトを作成するエージェントです。"
            "あなたには、ランディングページのHTMLが与えられます。"

            "**出力**:"
            "ランディングページのヒーローセクションに使用する画像を1つ提案し、それを画像生成するためのプロンプトを英語で作成してください。"
            """出力は厳密なJSON形式で、キーを"placeholder_css_1.jpg"とし、バリューをプロンプトとしてください。"""
        )
    )
    
    response = model.generate_content(str(prompt))
    image_information_json = safe_json_loads(response.text)
    print(image_information_json)

    ## プレースホルダーのファイル名とプロンプトをそれぞれリストにまとめる
    file_name_data = list(image_information_json.keys())
    prompt_data = list(image_information_json.values())
    print(file_name_data)
    print(prompt_data)

    ## リストの順番で画像生成
    if not ray.is_initialized():
        ray.init()
    try:
        image_tasks = [
            generate_image_by_imagen3.remote(image_prompt, file_name)
            for image_prompt, file_name in zip(prompt_data, file_name_data)
        ]
        generated_files = ray.get(image_tasks)
        # print(f"生成された画像ファイル: {generated_files}")
        time.sleep(0.5)
    except Exception as e:
        print(f"画像生成中にエラーが発生しました: {e}")

## 画像を適用するエージェント
def apply_image(html_data, css_data):
    print("\n===画像を適用するエージェント===")
    print("【Geminiでコードを修正中です．．．】")

    model = genai.GenerativeModel(
        # model_name = "gemini-2.0-pro-exp-02-05",
        model_name = "gemini-2.0-flash",
        generation_config = generation_config,
        system_instruction = (
            "あなたは、HTMLとCSSに画像を適用するエージェントです。"
            "あなたには、htmlコードとcssコードが与えられます。"

            "**出力**:"
            """*   "placeholder_css_1.jpg"という画像が、ヒーローセクションに背景として入ると想定し、htmlコードとcssコードを修正してください。"""
            "*   出力は、入力のコードを修正したhtmコード全文、cssコード全文としてください。"

            "**注意点**:"
            "*   変更はヒーローセクションに限定してください。他のセクションには手を加えないでください。"
            "*   画像上のテキストの可読性に注意して、テキストに影を加えたり画像上に暗いオーバーレイを入れたりと、工夫してください。"
            "*   画像のアスペクト比は16:9の想定です。コンテナーサイズは画像の高さに合わせて変更してください（800pxほど）。"
        )
    )
    prompt = (
        "**HTML**:"
        f"{html_data}"
        
        "**CSS**:"
        f"{css_data}"
    )
    response = model.generate_content(prompt)

    ## responseをhtmlコードとcssコードに分割
    print(response.text)
    html_code = extract_code_blocks_by_type(response.text)[0]
    css_code = extract_code_blocks_by_type(response.text)[1]
    print(html_code)
    print(css_code)

    ## ファイル保存
    save_to_file(html_code, "index.html")
    save_to_file(css_code, "style.css")

    return html_code, css_code


######################################
## メイン
######################################

def main(section_idea):
    ## ワイヤーフレーム作成エージェントに接続
    html_data = wireframe_generate_agent(section_idea)

    ## デザインエージェントに接続（CSS）
    css_data = design_css_agent(html_data)

    ## デザインエージェントに接続（JS）
    design_js_agent(html_data, css_data)

    ## 画像生成エージェントに接続
    image_generate_agent(html_data)

    ## 画像適用エージェントに接続
    apply_image(html_data, css_data)

    ## rayを使用している場合は終了
    if ray.is_initialized():
        ray.shutdown()

    print("\n【完了しました！　動作を終了します。】")


if __name__ == "__main__":
    ## ユーザーの入力例
    section_idea = """①：EasySpeak

②：オンライン英会話スクール

③：社会人向け

④：24時間対応、パーソナルカリキュラム

⑤：講師情報、お客様の声

⑥：株式会社アブソリュート"""

    main(section_idea)