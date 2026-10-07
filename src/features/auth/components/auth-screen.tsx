'use client';

import Image from 'next/image';
import { useState } from 'react';

import type { SignInFlow } from '../types';
import { SignInCard } from './sign-in-card';
import { SignUpCard } from './sign-up-card';

export const AuthScreen = () => {
  const [state, setState] = useState<SignInFlow>('signIn');

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 overflow-y-auto bg-[#5C3B58] p-4">
      <div className="flex items-center gap-2 text-white">
        <Image src="/logo.svg" alt="" width={36} height={36} priority />
        <span className="text-2xl font-bold tracking-tight">Slack Clone</span>
      </div>

      <div className="w-full max-w-[420px]">
        {state === 'signIn' ? <SignInCard setState={setState} /> : <SignUpCard setState={setState} />}
      </div>
    </div>
  );
};
