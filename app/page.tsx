// app/page.tsx
import AuditorForm from '@/components/AuditorForm';

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full flex flex-col items-center text-center mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-4xl">
          OLM Volunteer Auditor
        </h1>
        <p className="mt-2 text-base text-gray-400 tracking-wider">
          Reusable administration utilities for reconciling event sign-ups and attendance data.
        </p>
      </div>
      
      <AuditorForm />
    </main>
  );
}
