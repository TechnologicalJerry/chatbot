'use client';

import React from 'react';
import { ServerProvider } from '../context/ServerContext';
import { AuthProvider } from '../context/AuthContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ServerProvider>
      <AuthProvider>{children}</AuthProvider>
    </ServerProvider>
  );
}
