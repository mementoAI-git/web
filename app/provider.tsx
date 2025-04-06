"use client"

import { fetcher } from '@/api/fetcher';
import { PropsWithChildren } from 'react';
import { Toaster } from 'sonner';
import { SWRConfig } from 'swr';

export default function Providers({ children }: PropsWithChildren) {
  return (
    <div>
      <SWRConfig value={{ fetcher }}>
        {children}
        <Toaster position="top-center" closeButton />
      </SWRConfig>
    </div>
  )
}