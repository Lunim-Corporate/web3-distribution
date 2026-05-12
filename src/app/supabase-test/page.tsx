import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  // This will likely fail until the user provides the CORRECT Supabase keys
  const { data: projects, error } = await supabase.from('projects').select('*').limit(5)

  return (
    <div className="p-10 bg-slate-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Supabase SSR Connection Test</h1>
      
      {error ? (
        <div className="p-4 bg-red-500/20 border border-red-500 rounded-lg">
          <p className="font-bold">Connection Error:</p>
          <pre className="text-xs mt-2">{JSON.stringify(error, null, 2)}</pre>
          <p className="mt-4 text-sm text-red-300">
            Note: This error is expected if your API keys are still the "sb_publishable_..." Stripe keys.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {projects?.map((project) => (
            <li key={project.id} className="p-2 bg-white/5 rounded">
              {project.name}
            </li>
          ))}
          {projects?.length === 0 && <p>No projects found (or table is empty).</p>}
        </ul>
      )}
    </div>
  )
}
