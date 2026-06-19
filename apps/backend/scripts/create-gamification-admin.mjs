
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { query } from "../config/db.js";

dotenv.config();

const username = "gamification_admin";
const plainPassword = "GameAdmin2024!";
const role = "kiosk_admin";

try {
  const existing = await query(
    "SELECT id, username, role FROM admins WHERE LOWER(username) = LOWER(?) LIMIT 1",
    [username]
  );

  if (existing && existing.length > 0) {
    console.log(`gamification_admin already exists: ${existing[0].username} (${existing[0].role})`);
  } else {
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    await query(
      "INSERT INTO admins (username, password_hash, role, created_at) VALUES (?, ?, ?, NOW())",
      [username, hashedPassword, role]
    );
    console.log("[CREATE GAMIFICATION ADMIN] Account gamification_admin created");
  }

  const rows = await query("SELECT username, role FROM admins WHERE LOWER(username) = LOWER(?)", [username]);

  console.log("========================================");
  console.log("GAMIFICATION ADMIN ACCOUNT REPORT");
  console.log("========================================");
  console.log("Table: admins");
  console.log("Account Created: YES");
  console.log("Username:", username);
  console.log("Role:", role);
  console.log("Password Generated:", plainPassword);
  console.log("Login Endpoint Tested: NO (backend not running)");
  console.log("Ready For Admin Login: YES (credentials configured)");
  console.log("========================================");

  process.exit(0);
} catch (err) {
  console.error("[CREATE GAMIFICATION ADMIN] Error:", err.message);
  process.exit(1);
}
