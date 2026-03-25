"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-4">Creative Rights & Revenue Tracker</h1>
      <p className="text-lg text-gray-600 mb-6">Manage creative rights and track revenue with smart contract integration.</p>

      {user ? (
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <p className="text-lg">
            Signed in as <strong>{user.email}</strong>
            {user.isAdmin && <span className="ml-2 px-3 py-1 bg-red-500 text-white rounded text-sm">Admin</span>}
          </p>
        </div>
      ) : (
        <div className="bg-yellow-50 p-4 rounded-lg mb-6">
          <p className="text-lg">You are visiting as a guest.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/dashboard" className="p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Go to Dashboard
        </Link>

        {user?.isAdmin && (
          <Link href="/admin" className="p-4 bg-red-600 text-white rounded-lg hover:bg-red-700">
            Admin Panel
          </Link>
        )}

        {!user && (
          <>
            <Link href="/login" className="p-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
              Login
            </Link>
            <Link href="/signup" className="p-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
              Sign up
            </Link>
          </>
        )}
      </div>
    </main>
  );
}