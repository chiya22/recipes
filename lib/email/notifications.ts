import "server-only";
import { sendEmail } from "@/lib/email/resend";
import { listAdminEmails } from "@/lib/users";
import { env } from "@/lib/env";
import type { Recipe, User } from "@/types";

export type RecipeChangeAction = "created" | "updated" | "deleted";

const ACTION_LABEL: Record<RecipeChangeAction, string> = {
  created: "作成",
  updated: "更新",
  deleted: "削除",
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildHtml(params: {
  action: RecipeChangeAction;
  recipe: Recipe;
  actorName: string;
}): string {
  const { action, recipe, actorName } = params;
  const label = ACTION_LABEL[action];
  const title = escapeHtml(recipe.title);
  const actor = escapeHtml(actorName);
  const link = action === "deleted" ? `${env.appUrl}/trash` : env.appUrl;
  const linkLabel = action === "deleted" ? "ゴミ箱を開く" : "レシピを開く";

  return `
  <div style="font-family: -apple-system, 'Segoe UI', sans-serif; color: #202124; line-height: 1.6;">
    <p>${actor} さんがレシピを${label}しました。</p>
    <table style="margin: 12px 0; border-collapse: collapse;">
      <tr>
        <td style="padding: 4px 12px 4px 0; color: #5f6368;">タイトル</td>
        <td style="padding: 4px 0; font-weight: 600;">${title}</td>
      </tr>
      <tr>
        <td style="padding: 4px 12px 4px 0; color: #5f6368;">操作</td>
        <td style="padding: 4px 0;">${label}</td>
      </tr>
      <tr>
        <td style="padding: 4px 12px 4px 0; color: #5f6368;">操作者</td>
        <td style="padding: 4px 0;">${actor}</td>
      </tr>
    </table>
    <p>
      <a href="${link}" style="display: inline-block; padding: 8px 16px; background: #1a73e8; color: #fff; text-decoration: none; border-radius: 8px;">
        ${linkLabel}
      </a>
    </p>
  </div>`;
}

/**
 * レシピの作成/更新/削除を admin 全員にメール通知する。
 * 操作者本人（admin の場合）は通知対象から除外する。
 * メール送信の失敗が CRUD 本体を妨げないよう、内部で例外を握りつぶす。
 */
export async function notifyRecipeChange(params: {
  action: RecipeChangeAction;
  recipe: Recipe;
  actor: Pick<User, "id" | "name">;
}): Promise<void> {
  try {
    const { action, recipe, actor } = params;
    const admins = await listAdminEmails();
    const recipients = admins
      .filter((a) => a.id !== actor.id)
      .map((a) => a.email);

    if (recipients.length === 0) return;

    const label = ACTION_LABEL[action];
    await sendEmail({
      to: recipients,
      subject: `[レシピ] ${actor.name} さんがレシピ「${recipe.title}」を${label}しました`,
      html: buildHtml({ action, recipe, actorName: actor.name }),
    });
  } catch (err) {
    console.error("[notifyRecipeChange] メール通知に失敗しました", err);
  }
}
