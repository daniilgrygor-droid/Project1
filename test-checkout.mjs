import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

const envText = fs.readFileSync(".env.prod", "utf8");
const env = {};
for (const line of envText.split("\n")) {
  const m = line.match(/^\s*([^#=]+?)\s*=\s*(.*)\s*$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  env[m[1].trim()] = v;
}

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
const email = `test_${Date.now()}@example.com`;
const password = "Test123!Test123!";

console.log("Signing up", email);
const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
console.log("signUpError", signUpError);
console.log("signUp session?", !!signUpData.session);
if (signUpData.session) {
  console.log("Got session from signUp, trying checkout...");
  const res = await fetch("https://small-steps-seven.vercel.app/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${signUpData.session.access_token}` },
    body: JSON.stringify({ interval: "year" }),
  });
  console.log("checkout status", res.status);
  console.log("checkout body", await res.text());
} else {
  console.log("No session from signUp, trying signIn...");
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  console.log("signInError", signInError);
  console.log("signIn session?", !!signInData.session);
  if (signInData.session) {
    const res = await fetch("https://small-steps-seven.vercel.app/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${signInData.session.access_token}` },
      body: JSON.stringify({ interval: "year" }),
    });
    console.log("checkout status", res.status);
    console.log("checkout body", await res.text());
  } else {
    console.log("Cannot test checkout without confirmed email. Trying to check API error directly with no auth (should be 401)...");
    const res2 = await fetch("https://small-steps-seven.vercel.app/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ interval: "year" }),
    });
    console.log("unauth checkout", res2.status, await res2.text());
  }
}
