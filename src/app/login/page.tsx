"use client";

import { Suspense } from "react";
import { Login } from "../../views/Login";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <Login />
    </Suspense>
  );
}
