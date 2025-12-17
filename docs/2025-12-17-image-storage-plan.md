# 生成结果「图片本体存储」方案（Plan v1）

> 日期：2025-12-17  
> 目标：解决「目前仅保存 imageUrl，URL 可能过期」导致的资产丢失问题。

## 0. 当前决策（2025-12-17）

本项目目前部署在 **Vercel**，现阶段我们选择：

- **不存储图片二进制本体**（不做本地落盘/对象存储），只在 DB 中持久化 `imageUrl` 与 Prompt 等元数据
- 在产品体验上 **强引导用户“生成后立即下载”**（URL 可能过期），并提供 `/api/export` 导出备份

因此本文作为“未来可选扩展”的方案保留：当你希望实现“URL 永久在线/跨设备稳定访问”时，再落地图片本体存储。

## 1. 背景与问题

当前我们已经做到了：

- 生成接口 `/api/generate` 会把每次生成的 `prompt/size/modelIds/imageUrl` 记录到 SQLite（Prisma）
- `/gallery` 提供预览、下载、删除、清空、继续生成/图生图入口
- `/api/export` 支持导出 prompts/models/generations 的 JSON 备份（但不包含图片二进制本体）

核心缺口：

- Ark 返回的 `imageUrl` 可能是临时链接（有过期风险），仅保存 URL 并不能保证图片长期可用

因此下一阶段的“资产化”关键是：**把图片本体也存下来**（本地或对象存储）。

## 2. 目标与约束

### 目标

1. 生成后可长期访问图片（URL 不随上游过期）
2. 与现有 Prisma schema 兼容（尽量不改 schema）
3. 支持本地优先（开发/自部署），并可扩展到远端对象存储（生产/Serverless）
4. 失败不阻断生成流程（存储失败可回退到原始 `imageUrl`）

### 约束

- Vercel/Serverless 环境通常**没有持久磁盘**，不能依赖写本地文件
- SQLite/Prisma 当前 `GenerationResult.imageUrl` 只有一个字段，若要同时保留外链与内链，需要在 `paramsUsed/paramsOverride` 里冗余记录

## 3. 推荐实现：Storage Adapter（local/remote）

在 `src/lib/storage.ts` 基础上扩展一个存储抽象（示意）：

- `StorageProvider`
  - `putBytes(key, bytes, contentType): Promise<{ publicUrl: string }>`
  - `getPublicUrl(key): string`（可选）
- `getStorageProvider()`：根据 `NEXT_PUBLIC_STORAGE_MODE`（local/remote）返回 provider

### local provider（开发/自部署）

- 文件落盘：`data/generated-images/<resultId>.<ext>`
- 访问方式：
  - 推荐：新增 API route `GET /api/images/:resultId`，读取文件并流式返回
  - 或者（不推荐）：写入 `public/generated/**`（构建产物与运行写入耦合较强）

### remote provider（生产/Serverless）

- 目标：S3 兼容（R2/MinIO/OSS 均可）或后续接入火山对象存储
- 配置（示例）：
  - `STORAGE_S3_ENDPOINT`（可选，R2/MinIO 需要）
  - `STORAGE_S3_REGION`
  - `STORAGE_S3_BUCKET`
  - `STORAGE_S3_ACCESS_KEY_ID`
  - `STORAGE_S3_SECRET_ACCESS_KEY`
  - `STORAGE_PUBLIC_BASE_URL`（可选，用于拼公共访问 URL）

## 4. 写入流程（建议）

以“生成成功”路径为例：

1. `handleGenerateRequest` 拿到上游 `imageUrl`
2. 先 `persistGeneration(...)` 写入一条 SUCCESS 记录（得到 `resultId`）
3. 异步执行「存图片」：
   - `fetch(imageUrl)` 拉取二进制
   - `provider.putBytes("generations/<resultId>", bytes, contentType)`
   - 更新 DB：把 `GenerationResult.imageUrl` 替换为 `publicUrl`
   - 在 `paramsUsed` 里保留 `externalImageUrl`（便于追溯/回退）
4. 若存储失败：DB 保持原 `imageUrl`，并记录 `storageError`（也写入 `paramsUsed` 或 `error` 扩展字段，二选一）

> 关键点：存储失败不影响用户拿到生成结果；但成功后会自动“稳定化” URL。

## 5. 历史数据迁移（可选但推荐）

为已存在的 generation 记录提供“补存”能力：

- `/gallery` 中对每条记录提供“补存图片”按钮（Server Action）
- 批量补存：按 createdAt 倒序 N 条逐条补存（注意限流与失败重试策略）

## 6. 测试策略

- Unit：
  - local provider：使用临时目录，验证写入路径/扩展名/元数据
  - remote provider：只测请求参数组装（mock SDK client）
- Integration：
  - 生成成功 → mock 上游图片下载 → 确认 DB `imageUrl` 被替换为稳定 URL
  - 存储失败 → DB 保留外链，且不影响 `/api/generate` 返回 200

## 7. 里程碑建议（顺序）

1. local provider + `/api/images/:id`（跑通端到端）
2. 生成后自动存储 + DB 更新
3. `/gallery` 增加“补存/批量补存”
4. remote provider（S3 兼容）与文档化部署
