#!/usr/bin/env python3
"""
GSC 批量提交辅助工具 - Day 1 专用版（无交互，直接输出）
"""

from pathlib import Path
from datetime import datetime

QUEUE_FILE = Path.home() / "Desktop/kidsmobi/front/.workbuddy/tmp/gsc/gsc_submit_queue_20261127.txt"
DAILY_LIMIT = 15

# 加载队列
with open(QUEUE_FILE) as f:
    urls = [line.strip() for line in f if line.strip()]

print(f"\n{'='*70}")
print(f"📅 GSC 第 1 天提交清单 - {datetime.now().strftime('%Y-%m-%d')}")
print(f"{'='*70}\n")

print(f"🔗 打开：https://search.google.com/search-console/url-inspection\n")

print("📎 今日 URL (复制粘贴到 GSC):")
print("-" * 70)
for i, url in enumerate(urls[:DAILY_LIMIT], 1):
    priority = "🔥" if i <= 5 else "⭐" if i <= 10 else "📄"
    print(f"{i:2d}. {priority} {url}")
print("-" * 70)

print(f"\n💡 共{len(urls)}个URL，今日提交前{DAILY_LIMIT}个，剩余{len(urls)-DAILY_LIMIT}个待明天提交\n")
