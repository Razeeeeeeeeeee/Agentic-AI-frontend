'use client'

import { useRouter } from 'next/navigation'
import { getSession } from '@/lib/auth-client'
import { useAuth } from '@/providers/auth-provider'
import { useEffect } from 'react'

export default function AuthCallbackPage() {
  const { refreshSession } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        await refreshSession()
        const result = await getSession()
        const maybeData = result && typeof result === 'object' && 'data' in result ? (result as any).data : result
        const hasUser = !!(maybeData && typeof maybeData === 'object' && 'user' in maybeData)
        router.push(hasUser ? '/dashboard' : '/login')
      } catch {
        router.push('/login')
      }
    }

    handleCallback()
  }, [router, refreshSession])

  return null
}
