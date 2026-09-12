"use client";

import { PrivateRoute } from "../../components/PrivateRoute";
import { Layout } from "../../components/Layout/Layout";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PrivateRoute>
      <Layout>{children}</Layout>
    </PrivateRoute>
  );
}
