import os
import asyncio
import uuid
import json
import time
import base64
from datetime import datetime
from typing import Dict, List, Optional, Any
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
import shutil

# もとのPythonスクリプトから関数をインポート
from lp_generator import (
    wireframe_generate_agent,
    design_css_agent,
    design_js_agent,
    image_generate_agent,
    apply_image
)

app = FastAPI(title="LP Generator API")

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 本番環境では適切に設定してください
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# データモデル
class LPGenerationRequest(BaseModel):
    serviceName: str
    serviceType: str
    targetAudience: str
    features: str
    testimonials: str
    companyName: str

class GenerationStep(BaseModel):
    id: str
    name: str
    description: str
    status: str
    progress: float

class JobStatus(BaseModel):
    jobId: str
    status: str
    progress: float
    currentStep: str
    steps: List[GenerationStep]
    error: Optional[str] = None
    result: Optional[Dict[str, Any]] = None

# ジョブの状態を保存する辞書
jobs = {}

# ジョブディレクトリの準備
os.makedirs("jobs", exist_ok=True)

# セクションアイデアをフォーマットする関数
def format_section_idea(data: LPGenerationRequest) -> str:
    return f"""①：{data.serviceName}

②：{data.serviceType}

③：{data.targetAudience}

④：{data.features}

⑤：{data.testimonials}

⑥：{data.companyName}"""

# ジョブの状態を更新する関数
def update_job_status(job_id: str, status: str, progress: float, current_step: str, 
                      steps: List[GenerationStep], error: Optional[str] = None, 
                      result: Optional[Dict[str, Any]] = None):
    if job_id in jobs:
        jobs[job_id].update({
            "status": status,
            "progress": progress,
            "currentStep": current_step,
            "steps": [step.dict() for step in steps],
        })
        
        if error:
            jobs[job_id]["error"] = error
            
        if result:
            jobs[job_id]["result"] = result
            
        # ジョブ状態をファイルに保存
        job_dir = f"jobs/{job_id}"
        os.makedirs(job_dir, exist_ok=True)
        
        with open(f"{job_dir}/status.json", "w") as f:
            json.dump(jobs[job_id], f)

# バックグラウンドでLPを生成する関数
async def generate_lp_background(job_id: str, data: LPGenerationRequest):
    try:
        # ジョブディレクトリを作成
        job_dir = f"jobs/{job_id}"
        os.makedirs(job_dir, exist_ok=True)
        os.chdir(job_dir)
        
        # 初期ステップの設定
        steps = [
            GenerationStep(
                id="wireframe",
                name="ワイヤーフレーム作成",
                description="HTML構造の生成",
                status="pending",
                progress=0,
            ),
            GenerationStep(
                id="css",
                name="デザイン適用",
                description="CSSスタイルの生成",
                status="pending",
                progress=0,
            ),
            GenerationStep(
                id="js",
                name="インタラクション追加",
                description="JavaScript機能の実装",
                status="pending",
                progress=0,
            ),
            GenerationStep(
                id="image",
                name="画像生成",
                description="AIによる画像の生成",
                status="pending",
                progress=0,
            ),
            GenerationStep(
                id="apply-image",
                name="画像適用",
                description="生成された画像の適用",
                status="pending",
                progress=0,
            ),
        ]
        
        # セクションアイデアをフォーマット
        section_idea = format_section_idea(data)
        
        # 1. ワイヤーフレーム作成
        steps[0].status = "processing"
        update_job_status(job_id, "processing", 10, "wireframe", steps)
        
        html_data = wireframe_generate_agent(section_idea)
        
        steps[0].status = "completed"
        steps[0].progress = 100
        steps[1].status = "processing"
        update_job_status(job_id, "processing", 30, "css", steps)
        
        # 2. デザイン適用（CSS）
        css_data = design_css_agent(html_data)
        
        steps[1].status = "completed"
        steps[1].progress = 100
        steps[2].status = "processing"
        update_job_status(job_id, "processing", 50, "js", steps)
        
        # 3. デザイン適用（JS）
        js_data = design_js_agent(html_data, css_data)
        
        steps[2].status = "completed"
        steps[2].progress = 100
        steps[3].status = "processing"
        update_job_status(job_id, "processing", 70, "image", steps)
        
        # 4. 画像生成
        image_generate_agent(html_data)
        
        steps[3].status = "completed"
        steps[3].progress = 100
        steps[4].status = "processing"
        update_job_status(job_id, "processing", 90, "apply-image", steps)
        
        # 5. 画像適用
        final_html_data, final_css_data = apply_image(html_data, css_data)
        
        steps[4].status = "completed"
        steps[4].progress = 100
        
        # ファイルを読み取り、結果を準備
        with open("index.html", "r", encoding="utf-8") as f:
            final_html = f.read()
            
        with open("style.css", "r", encoding="utf-8") as f:
            final_css = f.read()
            
        with open("script.js", "r", encoding="utf-8") as f:
            final_js = f.read()
            
        # 画像をBase64エンコード
        image_base64 = ""
        try:
            with open("placeholder_css_1.jpg", "rb") as image_file:
                image_base64 = base64.b64encode(image_file.read()).decode('utf-8')
        except Exception as e:
            print(f"画像エンコード中にエラー: {e}")
            
        # 結果を作成
        result = {
            "jobId": job_id,
            "html": final_html,
            "css": final_css,
            "js": final_js,
            "imageBase64": f"data:image/jpeg;base64,{image_base64}" if image_base64 else "",
            "createdAt": datetime.now().isoformat(),
        }
        
        # 圧縮用ディレクトリを準備
        zip_dir = f"../zip-{job_id}"
        os.makedirs(zip_dir, exist_ok=True)
        
        # 結果ファイルをコピー
        shutil.copy("index.html", f"{zip_dir}/index.html")
        shutil.copy("style.css", f"{zip_dir}/style.css")
        shutil.copy("script.js", f"{zip_dir}/script.js")
        
        # 画像ファイルがあればコピー
        if os.path.exists("placeholder_css_1.jpg"):
            shutil.copy("placeholder_css_1.jpg", f"{zip_dir}/placeholder_css_1.jpg")
        
        # ファイルを圧縮
        shutil.make_archive(f"../download-{job_id}", "zip", zip_dir)
        
        # 一時ディレクトリを削除
        shutil.rmtree(zip_dir)
        
        # 状態を完了に更新
        update_job_status(job_id, "completed", 100, "completed", steps, result=result)
        
    except Exception as e:
        print(f"Error in job {job_id}: {str(e)}")
        
        # エラー状態を更新
        steps_with_error = []
        for step in steps:
            if step.status == "processing":
                step.status = "error"
            steps_with_error.append(step)
            
        update_job_status(job_id, "error", 0, "", steps_with_error, error=str(e))
        
    finally:
        # 作業ディレクトリを元に戻す
        os.chdir("../..")

# エンドポイント
@app.post("/api/generate")
async def generate_lp(data: LPGenerationRequest, background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())
    
    # 初期ステップの設定
    steps = [
        GenerationStep(
            id="wireframe",
            name="ワイヤーフレーム作成",
            description="HTML構造の生成",
            status="pending",
            progress=0,
        ),
        GenerationStep(
            id="css",
            name="デザイン適用",
            description="CSSスタイルの生成",
            status="pending",
            progress=0,
        ),
        GenerationStep(
            id="js",
            name="インタラクション追加",
            description="JavaScript機能の実装",
            status="pending",
            progress=0,
        ),
        GenerationStep(
            id="image",
            name="画像生成",
            description="AIによる画像の生成",
            status="pending",
            progress=0,
        ),
        GenerationStep(
            id="apply-image",
            name="画像適用",
            description="生成された画像の適用",
            status="pending",
            progress=0,
        ),
    ]
    
    # ジョブ初期化
    jobs[job_id] = {
        "jobId": job_id,
        "status": "pending",
        "progress": 0,
        "currentStep": "",
        "steps": [step.dict() for step in steps],
        "createdAt": datetime.now().isoformat(),
    }
    
    # バックグラウンドタスク開始
    background_tasks.add_task(generate_lp_background, job_id, data)
    
    return {"jobId": job_id}

@app.get("/api/jobs/{job_id}")
async def get_job_status(job_id: str):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
        
    return jobs[job_id]

@app.get("/api/jobs")
async def get_jobs():
    # 最新順にソート
    sorted_jobs = sorted(
        [job for job in jobs.values()],
        key=lambda x: x.get("createdAt", ""), 
        reverse=True
    )
    
    return {"jobs": sorted_jobs}

@app.post("/api/jobs/{job_id}/retry")
async def retry_job(job_id: str, background_tasks: BackgroundTasks):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
        
    # 元のジョブから必要なデータを取得
    original_job = jobs[job_id]
    
    if "originalData" not in original_job:
        raise HTTPException(status_code=400, detail="Original data not found for retry")
        
    # 新しいジョブを作成
    new_job_id = str(uuid.uuid4())
    data = LPGenerationRequest(**original_job["originalData"])
    
    # 初期ステップの設定
    steps = [
        GenerationStep(
            id="wireframe",
            name="ワイヤーフレーム作成",
            description="HTML構造の生成",
            status="pending",
            progress=0,
        ),
        GenerationStep(
            id="css",
            name="デザイン適用",
            description="CSSスタイルの生成",
            status="pending",
            progress=0,
        ),
        GenerationStep(
            id="js",
            name="インタラクション追加",
            description="JavaScript機能の実装",
            status="pending",
            progress=0,
        ),
        GenerationStep(
            id="image",
            name="画像生成",
            description="AIによる画像の生成",
            status="pending",
            progress=0,
        ),
        GenerationStep(
            id="apply-image",
            name="画像適用",
            description="生成された画像の適用",
            status="pending",
            progress=0,
        ),
    ]
    
    # ジョブ初期化
    jobs[new_job_id] = {
        "jobId": new_job_id,
        "status": "pending",
        "progress": 0,
        "currentStep": "",
        "steps": [step.dict() for step in steps],
        "createdAt": datetime.now().isoformat(),
        "originalData": original_job["originalData"],
        "retryOf": job_id,
    }
    
    # バックグラウンドタスク開始
    background_tasks.add_task(generate_lp_background, new_job_id, data)
    
    return {"jobId": new_job_id}

@app.get("/api/jobs/{job_id}/download")
async def download_job(job_id: str):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
        
    job = jobs[job_id]
    
    if job["status"] != "completed":
        raise HTTPException(status_code=400, detail="Job is not completed yet")
        
    download_path = f"download-{job_id}.zip"
    
    if not os.path.exists(download_path):
        raise HTTPException(status_code=404, detail="Download file not found")
        
    return FileResponse(
        path=download_path,
        filename=f"lp-{job_id}.zip",
        media_type="application/zip"
    )

# サーバー起動
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)