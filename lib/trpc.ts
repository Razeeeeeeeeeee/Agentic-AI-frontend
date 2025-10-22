import { createTRPCReact } from '@trpc/react-query';
import { createTRPCClient, httpBatchLink } from '@trpc/client';

// Use untyped TRPC client on the web to avoid cross-package type/import issues at build time
export const trpc = createTRPCReact<any>();

// Use environment variable for backend URL, fallback to localhost for development
const getBackendUrl = () => {
  // Next.js exposes public env vars prefixed with NEXT_PUBLIC_
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002';
  return `${backendUrl}/trpc`;
};

export const trpcClient = createTRPCClient<any>({
  links: [
    httpBatchLink({
      url: getBackendUrl(),
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: 'include', // Always include cookies for cross-origin
        });
      },
    }),
  ],
});