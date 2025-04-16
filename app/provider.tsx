"use client"

import { fetcher } from '@/api/fetcher';
import { ModalProvider } from '@/hooks/use-modal';
import { StoreProvider } from '@/hooks/use-store';
import { PropsWithChildren } from 'react';
import { Toaster } from 'sonner';
import { SWRConfig } from 'swr';

export default function Providers({ children }: PropsWithChildren) {
  return (
    <StoreProvider>
      <ModalProvider>
        <SWRConfig value={{ fetcher }}>
          {children}
          <Toaster position="top-center" closeButton />
        </SWRConfig>
      </ModalProvider>
    </StoreProvider>
  )
}