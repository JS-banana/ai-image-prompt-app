# Ark 接入与验证记录（Seedream 4.5 / DeepSeek V3.2）

## 环境

- Endpoint：`SEEDREAM4_ENDPOINT`（.env.local 中提供，默认可回退到 `https://ark.cn-beijing.volces.com/api/v3/images/generations`）。
- Key：`volcengine_api_key`（统一用于 Seedream/DeepSeek，兼容读取 `SEEDREAM_API_KEY`）。
- 脚本：`pnpm test:ark`（执行 `scripts/ark-smoketest.ts`，自动读取 .env 与 .env.local）。

## 测试结果（最新一次）

- **Seedream 4.5 成功**：
  - 请求：2K 分辨率、无水印、示例 prompt。
  - 响应摘要：`data[0].url` 返回可访问的 JPEG（例：`.../doubao-seedream-4-5/...0.jpeg?...`）；`usage` 显示 `generated_images: 1`。
- **DeepSeek V3.2 失败**：
  - Endpoint 试用：`https://ark.cn-beijing.volces.com/api/v3/model-api/deepseek-v3-2`（同 Key）。
  - 响应：HTTP 404，错误信息 `InvalidEndpointOrModel.NotFound`，提示“模型或 endpoint deepseek-v3-2 不存在或无访问权限”。

## 结论与建议

- Seedream 4.5 已可直接调用，生成 URL 可复用到前端展示。
- DeepSeek V3.2 需确认账户权限或正确 Endpoint：
  1. 在控制台确认是否创建了 DeepSeek 专属 Endpoint（如 `ep-xxxxx`），并在环境变量提供 `DEEPSEEK_ENDPOINT`/Key。
  2. 或启用官方 Chat Completions 兼容接口（若可用 `https://ark.cn-beijing.volces.com/api/v3/chat/completions`）。
- 一旦获取到有效 Endpoint，可在 `src/lib/clients/ark.ts` 中更新 `DEFAULT_CHAT_ENDPOINT` 或通过参数覆盖。
