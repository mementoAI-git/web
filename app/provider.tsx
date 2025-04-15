"use client"

import { fetcher } from '@/api/fetcher';
import { StoreProvider } from '@/hooks/use-store';
import { PropsWithChildren } from 'react';
import { Toaster } from 'sonner';
import { SWRConfig } from 'swr';

export default function Providers({ children }: PropsWithChildren) {
  return (
    <StoreProvider>
      <SWRConfig value={{ fetcher }}>
        {children}
        <Toaster position="top-center" closeButton />
      </SWRConfig>
    </StoreProvider>
  )
}