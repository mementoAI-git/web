import { PropsWithChildren } from 'react';
import { Slide, ToastContainer, toast } from 'react-toastify';

export default function Providers({ children }: PropsWithChildren) {
  return (
    <div>
      {children}

      <ToastContainer
        position="bottom-center"
        autoClose={5000}
        limit={3}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        stacked
        transition={Slide}
      />
    </div>
  )
}