// scripts/check-env.js
// Fix #20: valida que las variables de entorno requeridas estén definidas
// antes de que Vite arranque el build. Si faltan, el proceso termina con
// código de error y el deploy de Vercel (o CI) se interrumpe visiblemente
// en vez de llegar a producción con una app en blanco.

const REQUIRED_VARS = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
];

const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error("\n❌ Build abortado: faltan variables de entorno requeridas:\n");
  missing.forEach((key) => console.error(`   • ${key}`));
  console.error(
    "\nAgrega estas variables en el panel de tu hosting (Vercel → Settings → Environment Variables)\n" +
    "o en tu archivo .env.local para desarrollo local.\n"
  );
  process.exit(1);
}

console.log("✅ Variables de entorno verificadas correctamente.\n");
