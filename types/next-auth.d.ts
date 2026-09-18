import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      hospitalId: string;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    hospitalId: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    hospitalId: string;
  }
}