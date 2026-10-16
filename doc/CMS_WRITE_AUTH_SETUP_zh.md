# CMS 写接口认证配置（#48）— 部署指南

日期：2026-10-16 · 仓库：`front/` + `backend/` · 状态：**front 已部署；backend Worker 闸门已实现待部署**

## 生产架构（重要勘误）

`store.balancebiketoddler.com/api/*` 的 CMS API 由 **backend 仓库的 Cloudflare Worker
`kidsmobi-api-v1`**（`backend/api/worker/`，路由见其 `wrangler.toml`）承载，通过
`backend/scripts/deploy_worker_api.sh` **手动部署**——front 仓库 push **不会**更新它。
front 的 `src/apiServer.ts`（经 `api/index.ts` 进 Vercel）只是测试宿主。

因此 #48 闸门必须两边都加：front 侧（已做，随 `f5fc164` 上线 Vercel/Pages）
与 backend Worker 侧（本次新增，待部署）。

## 改了什么

### front 仓库（`f5fc164`，已 push 并部署）

| 文件 | 改动 |
|---|---|
| `src/apiServer.ts` | `app.use("/api/cms")` 中间件：拦截所有 POST/PUT/DELETE 与 `GET /api/cms/ops/export`，除非 `canAccessAllScope()` 通过。`[audit]` 日志。 |
| `src/lib/cmsD1Service.ts` | `requestJson()` 从 `VITE_CMS_ADMIN_ALL_TOKEN` 发送 `x-cms-admin-token`。 |
| `scripts/_cmsAdminToken.mjs` | 写脚本共享 helper（`adminHeaders()`）。 |
| 13 个写脚本 | 从 `CMS_ADMIN_ALL_TOKEN` 环境变量发送 token。 |

### backend 仓库（`backend/api/worker/src/index.ts`，待部署）

| 位置 | 改动 |
|---|---|
| `Env` | 新增 `CMS_ADMIN_ALL_TOKEN?: string`。 |
| `isCMSAdminScope()` | 与 front 的 `canAccessAllScope()` 对齐：token 匹配放行；`cf-connecting-ip` 缺失/loopback（wrangler dev）放行。 |
| `handleRequest()` 顶部 | `/api/cms/` 下 POST/PUT/DELETE 与 `GET /api/cms/ops/export` 未过闸 → `403 AdminTokenRequired`。公开 GET 读（collections、ops/overview、ops/events、assets、d1/health）保持开放。403 天然跳过 R42 的写后边缘缓存 purge。 |

`tsc --noEmit` 通过。本地 workerd 冒烟在本机不可用（Windows VC++ 已知问题），
以部署后线上探针为准（见下）。

## ⚠️ 部署前必做

同一个强随机值（`openssl rand -hex 32`）设到：

1. **Worker secret**：`CMS_ADMIN_ALL_TOKEN` → `kidsmobi-api-v1`
   （`cd backend/api/worker && npx wrangler secret put CMS_ADMIN_ALL_TOKEN`，
   或 Cloudflare 面板 Workers → kidsmobi-api-v1 → Settings → Variables）。
2. **`VITE_CMS_ADMIN_ALL_TOKEN`**：前端 Pages 项目的**构建**环境变量
   （Vite 构建时内联进 bundle；用户已配置，`f5fc164` 的 Pages 构建已包含）。

> 已知局限（快速方案已接受）：`VITE_` 变量在公开 JS bundle 里可读 → 「模糊安全」，
> 挡 drive-by 篡改/SEO 垃圾写入，挡不住读 bundle 的攻击者。彻底方案为 session
> 鉴权（#48 后续）。

## 上线顺序（Worker）

```bash
cd backend/api/worker
npx wrangler secret put CMS_ADMIN_ALL_TOKEN   # 粘贴强随机值
npx wrangler deploy                            # 只改了代码，无需 R2 数据同步
# 或 bash ../../scripts/deploy_worker_api.sh（需 CLOUDFLARE_API_TOKEN/ACCOUNT_ID）
```

## 部署后验证（全部无害探针）

```bash
# 1. 公开读不受影响 → 期望 200
curl -s -o /dev/null -w "%{http_code}\n" "https://store.balancebiketoddler.com/api/cms/products?cb=$(date +%s)"

# 2. 无 token 全库导出 → 期望 403（闸门生效的铁证）
curl -s -o /dev/null -w "%{http_code}\n" "https://store.balancebiketoddler.com/api/cms/ops/export?cb=$(date +%s)"

# 3. 无 token 写 → 期望 403（闸门先于路由，不触库）
curl -s -o /dev/null -w "%{http_code}\n" -X POST -H "Content-Type: application/json" -d '{}' \
  "https://store.balancebiketoddler.com/api/cms/no-such-collection/save?cb=$(date +%s)"

# 4. 带 token 同探针 → 期望 404（闸门放行、集合不存在——无害）
curl -s -o /dev/null -w "%{http_code}\n" -X POST -H "Content-Type: application/json" -d '{}' \
  -H "x-cms-admin-token: <你的TOKEN>" \
  "https://store.balancebiketoddler.com/api/cms/no-such-collection/save?cb=$(date +%s)"
```

> ⚠️ 不要在生产上用「无 token POST `/api/cms/settings/save` + `{}`」做探针：
> 若闸门尚未生效，`{}` 会被真实写入 settings，破坏线上配置。用上面的
> 不存在集合探针替代。

## 日常运维

- **管理后台**：走前端 bundle 内的 `VITE_CMS_ADMIN_ALL_TOKEN`，自动过闸。
- **写脚本**（front/scripts）：环境里设 `CMS_ADMIN_ALL_TOKEN`，更新的脚本自动带头；
  新脚本用 `scripts/_cmsAdminToken.mjs` 的 `adminHeaders()`。
- **本地开发**：loopback / 无 `cf-connecting-ip` 自动放行。
- Worker 在成功 POST 后自动 purge CMS 边缘缓存（R42），无需手动清。
