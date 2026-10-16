# CMS 写接口认证配置（#48）— 部署指南

日期：2026-10-16 · 仓库：`front/` · 状态：**代码就绪，尚未部署**

## 改了什么

此前 CMS 写接口完全无鉴权（知道 URL 即可改写 settings/商品，或经
`/api/cms/ops/export` 导出整库）。本次改动加了一道共享密钥 token 闸门：

| 文件 | 改动 |
|---|---|
| `src/apiServer.ts` | 新增 `app.use("/api/cms", ...)` 中间件：拦截 `/api/cms` 下所有 POST/PUT/DELETE 以及 `GET /api/cms/ops/export`，除非 `canAccessAllScope()` 通过（loopback，或 `x-cms-admin-token` 头 == `CMS_ADMIN_ALL_TOKEN` 环境变量）。公开 GET 读接口保持开放。被拦截请求会打 `[audit]` 日志。 |
| `src/lib/cmsD1Service.ts` | `requestJson()` 现在从 `VITE_CMS_ADMIN_ALL_TOKEN` 发送 `x-cms-admin-token`，让管理后台能过闸。 |
| `scripts/_cmsAdminToken.mjs` | 未来写脚本的共享 helper（`adminHeaders()`）。 |
| 13 个写脚本 | 全部改为从 `CMS_ADMIN_ALL_TOKEN` 环境变量发送 `x-cms-admin-token`。 |

已本地验证（5 个探针）：公开 GET 放行（503 = D1 未配置，不是 403）、loopback 写放行、
伪造外部 IP 无 token 写 → 403、带正确 token → 放行、`ops/export` 无 token → 403。
`tsc --noEmit` 通过。

## ⚠️ 部署前必做

如果这份代码在**没有**设置环境变量的情况下上线，所有远程 CMS 写入（包括管理后台）
都会 403——站点管理功能会断。请把下面两个变量设为**同一个强随机值**
（如 `openssl rand -hex 32`）：

1. **`CMS_ADMIN_ALL_TOKEN`** —— 承载 CMS API 的项目（`store.balancebiketoddler.com`
   背后的部署）的环境变量（Production）。
2. **`VITE_CMS_ADMIN_ALL_TOKEN`** —— 前端 Pages 项目（`balancebiketoddler.com`）
   的构建环境变量。Vite 在构建时把它内联进客户端 bundle，所以必须在构建时存在。

> 已知局限（快速方案已接受）：`VITE_` 变量会打进公开的 JS bundle，所以这是
> 「模糊安全」——能挡住 drive-by 滥用和 SEO 垃圾写入，挡不住会读 bundle 的坚定攻击者。
> 彻底方案是 session 鉴权（verify-code 签发签名 httpOnly cookie），已记为 #48 后续。

## 上线顺序

1. 在托管面板把两个环境变量设为同一值。
2. 先部署 API 宿主，再部署前端构建（push `main`）。
3. 验证：

```bash
# 应被拦截（期望 403）：无 token 写入
curl -s -o /dev/null -w "%{http_code}\n" -X POST -H "Content-Type: application/json" \
  -d '{}' -H "X-Forwarded-For: 203.0.113.9" https://store.balancebiketoddler.com/api/cms/settings/save
# -> 403

# 应放行（期望非 403）：带 token 写入
curl -s -o /dev/null -w "%{http_code}\n" -X POST -H "Content-Type: application/json" \
  -d '{}' -H "X-Forwarded-For: 203.0.113.9" \
  -H "x-cms-admin-token: <你的TOKEN>" https://store.balancebiketoddler.com/api/cms/settings/save

# 应被拦截（期望 403）：无 token 全库导出
curl -s -o /dev/null -w "%{http_code}\n" -H "X-Forwarded-For: 203.0.113.9" \
  https://store.balancebiketoddler.com/api/cms/ops/export
```

（save 探针返回 503 = `{}` body 触发的「D1 not configured」——说明闸门放行了，这正是
要验证的。只有 403 才代表被拦。）

## 日常运维

- 本地开发（`npm run dev`）：loopback 自动放行，无需 token。
- 任何会改 CMS 的脚本：在环境里设 `CMS_ADMIN_ALL_TOKEN`（已更新的脚本会自动带上；
  新脚本应使用 `scripts/_cmsAdminToken.mjs` 的 `adminHeaders()`）。
- `scripts/README.md` 的 m3 门禁检查用的就是同一个环境变量名。
