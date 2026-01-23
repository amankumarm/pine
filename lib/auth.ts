import { createClient } from './supabase/server'

// Network call to Supabase - validates token with server (~100-500ms)
// Use for sensitive operations that need server-side validation
export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

// Reads from session cookie - no network call (~1-5ms)
// Use for performance-critical operations where middleware already validated
export async function getCurrentUserFromSession() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.user ?? null
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
}

