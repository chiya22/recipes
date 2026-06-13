-- フェーズ 3: Storage バケット recipe-images（private）
-- アップロード・署名付き URL 生成はサーバー側（service_role）で行うため、
-- anon/authenticated 向けの storage ポリシーは作成しない（デフォルト拒否）。

insert into storage.buckets (id, name, public)
values ('recipe-images', 'recipe-images', false)
on conflict (id) do nothing;
