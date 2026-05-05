# Guestbook Supabase Setup

这个目录用于给 `doloressu.com` 的公开留言墙创建 Supabase 数据表。

## 一键建表

在仓库根目录执行：

```bash
SUPABASE_ACCESS_TOKEN="你的 Supabase access token" \
SUPABASE_PROJECT_REF="你的 Supabase project ref" \
SUPABASE_URL="https://你的项目.supabase.co" \
SUPABASE_ANON_KEY="你的 public anon key" \
node scripts/provision-guestbook.mjs
```

脚本会做两件事：

1. 执行 `supabase/guestbook.sql`，创建 `guestbook_messages` 表、索引和 RLS 策略。
2. 更新 `assets/guestbook-config.js`，把前端需要的 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY` 写进去。

注意：`anon key` 是 Supabase 前端公开使用的 key，依赖 RLS 控制权限；`service_role` 或 access token 不能写进前端文件。

## 留言字段

| 字段 | 用途 |
| --- | --- |
| `name` | 访客名字或昵称 |
| `message` | 公开留言 |
| `page` | 留言来源页面 |
| `status` | `visible` / `hidden` / `pending`，当前默认公开展示 |
| `tag` | 后续可用于分类筛选 |
| `created_at` | 创建时间 |

