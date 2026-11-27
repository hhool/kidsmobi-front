#!/usr/bin/env python3
"""
GSC 批量提交辅助工具 - 简化手动提交流程

由于 Google Search Console 的 API 限制（每天 12-15 次 URL Inspection），
此工具生成格式化的提交列表，让您复制粘贴到 GSC，而非真正自动提交。

使用方法:
    python3 scripts/seo/gsc-auto-submit-helper.py --day 1
    python3 scripts/seo/gsc-auto-submit-helper.py --day 2
    
输出:
    - 格式化 URL 列表（可直接复制到 GSC）
    - 进度追踪文件
"""

import argparse
from pathlib import Path
from datetime import datetime, timedelta

# 配置
QUEUE_FILE = Path.home() / "Desktop/kidsmobi/front/.workbuddy/tmp/gsc/gsc_submit_queue_20261127.txt"
PROGRESS_FILE = Path.home() / "Desktop/kidsmobi/.workbuddy/gsc-submission-progress.json"
DAILY_LIMIT = 15  # Google 免费配额

def load_queue():
    """加载待提交队列"""
    if not QUEUE_FILE.exists():
        print(f"❌ 队列文件不存在：{QUEUE_FILE}")
        print("\n请先生成队列：cd /Users/hou/Desktop/kidsmobi/front && node scripts/seo/gen-gsc-queue.mjs")
        return []
    
    with open(QUEUE_FILE) as f:
        urls = [line.strip() for line in f if line.strip()]
    return urls

def load_progress():
    """加载提交进度"""
    if not PROGRESS_FILE.exists():
        return {"submitted": 0, "last_date": None, "history": []}
    
    import json
    with open(PROGRESS_FILE) as f:
        return json.load(f)

def save_progress(progress):
    """保存提交进度"""
    import json
    PROGRESS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(progress, f, indent=2, ensure_ascii=False)

def get_today_urls(queue, progress):
    """获取今日应提交的 URL"""
    submitted_count = progress["submitted"]
    remaining = queue[submitted_count:]
    
    if len(remaining) == 0:
        print("✅ 所有 URL 已提交完成！")
        return []
    
    today_urls = remaining[:DAILY_LIMIT]
    return today_urls

def format_for_gsc(urls, day_num):
    """格式化为 GSC 友好格式"""
    print(f"\n{'='*70}")
    print(f"📅 第 {day_num} 天提交清单 - {datetime.now().strftime('%Y-%m-%d')}")
    print(f"{'='*70}\n")
    
    print(f"📋 今日任务：提交 {len(urls)} 个 URL 到 Google Search Console")
    print(f"🔗 打开：https://search.google.com/search-console/url-inspection\n")
    
    print("📝 操作步骤:")
    print("   1. 打开 GSC URL Inspection Tool")
    print("   2. 逐个粘贴下方 URL（每次 1 个）")
    print("   3. 点击 'REQUEST INDEXING'")
    print("   4. 完成后标记 ✅\n")
    
    print("📎 今日 URL 列表 (复制粘贴用):")
    print("-" * 70)
    for i, url in enumerate(urls, 1):
        priority = "🔥" if i <= 5 else "⭐" if i <= 10 else "📄"
        print(f"{i:2d}. {priority} {url}")
    print("-" * 70)
    
    print(f"\n💡 提示:")
    print(f"   - 前 5 个是最高优先级（composite guides）")
    print(f"   - 如果时间不够，至少提交前 10 个")
    print(f"   - 剩余 {max(0, len(queue) - progress.get('submitted', 0) - len(urls))} 个待提交\n")

def main():
    parser = argparse.ArgumentParser(description="GSC 批量提交辅助工具")
    parser.add_argument("--day", type=int, help="第几天提交（自动计算）", default=None)
    parser.add_argument("--reset", action="store_true", help="重置进度")
    args = parser.parse_args()
    
    # 重置进度
    if args.reset:
        save_progress({"submitted": 0, "last_date": None, "history": []})
        print("✅ 进度已重置")
        return
    
    # 加载数据
    queue = load_queue()
    if not queue:
        return
    
    progress = load_progress()
    
    # 计算今天是第几天
    if args.day:
        day_num = args.day
    else:
        # 自动计算
        last_date = progress.get("last_date")
        if last_date:
            last = datetime.fromisoformat(last_date)
            days_diff = (datetime.now() - last).days
            day_num = (progress["submitted"] // DAILY_LIMIT) + 1
        else:
            day_num = 1
    
    # 获取今日 URL
    today_urls = get_today_urls(queue, progress)
    
    if not today_urls:
        return
    
    # 格式化输出
    format_for_gsc(today_urls, day_num)
    
    # 询问是否标记为已提交
    print("\n❓ 提交完成后，请输入 'done' 更新进度（或按回车跳过）: ")
    try:
        user_input = input().strip().lower()
        if user_input == "done":
            progress["submitted"] += len(today_urls)
            progress["last_date"] = datetime.now().isoformat()
            progress["history"].append({
                "day": day_num,
                "date": datetime.now().isoformat(),
                "urls_submitted": len(today_urls),
                "total_submitted": progress["submitted"]
            })
            save_progress(progress)
            print(f"✅ 进度已更新：已提交 {progress['submitted']}/{len(queue)} 个 URL")
            
            # 显示下次提交提醒
            next_urls = get_today_urls(queue, progress)
            if next_urls:
                tomorrow = datetime.now() + timedelta(days=1)
                print(f"⏰ 明天继续提交 {len(next_urls)} 个 URL")
            else:
                print("🎉 恭喜！所有 URL 已提交完成")
    except KeyboardInterrupt:
        print("\n⚠️  已取消，下次运行时会继续")

if __name__ == "__main__":
    main()
