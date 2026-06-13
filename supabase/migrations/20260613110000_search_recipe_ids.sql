-- 日本語全文検索 RPC。
-- PGroonga の &@ 演算子は PostgREST のクエリビルダから直接使えないため、
-- 検索条件に一致する recipe.id を返す関数を用意し、アプリ側で id 絞り込みに利用する。
-- title / ingredients / instructions / notes に加え、タグ名も対象にする（OR）。
-- q は Groonga クエリ構文（空白区切りで AND）。特殊文字のサニタイズはアプリ側で行う。
create or replace function public.search_recipe_ids(q text)
returns setof uuid
language sql
stable
set search_path = ''
as $$
  select r.id
  from public.recipes r
  where r.deleted_at is null
    and (
      r.title operator(public.&@~) q
      or r.ingredients operator(public.&@~) q
      or r.instructions operator(public.&@~) q
      or r.notes operator(public.&@~) q
      or exists (
        select 1
        from public.recipe_tags rt
        join public.tags t on t.id = rt.tag_id
        where rt.recipe_id = r.id
          and t.name operator(public.&@~) q
      )
    );
$$;
