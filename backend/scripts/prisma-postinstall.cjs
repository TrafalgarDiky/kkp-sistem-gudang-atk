/**
 * postinstall: hanya prisma generate jika schema sudah ada.
 * Docker: npm ci sebelum COPY prisma/ → skip. Setelah COPY, RUN npx prisma generate di Dockerfile.
 */
const fs = require("fs");
const { execSync } = require("child_process");
if (fs.existsSync("prisma/schema.prisma")) {
  execSync("npx prisma generate", { stdio: "inherit" });
}
