// パスワードを bcrypt ハッシュ化する補助スクリプト（初期 admin 作成用）。
// 使い方: node scripts/hash-password.mjs "your-password"
import bcrypt from "bcryptjs";

const password = process.argv[2];
if (!password) {
  console.error('使い方: node scripts/hash-password.mjs "your-password"');
  process.exit(1);
}

const hash = await bcrypt.hash(password, 10);
console.log(hash);
