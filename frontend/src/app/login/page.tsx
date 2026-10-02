import Link from 'next/link';

export default function LoginSelection() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-900">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Select Login Type
          </h2>
        </div>
        
        <div className="space-y-4 pt-4">
          <Link href="/login/admin" className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 md:text-lg transition-colors">
            Admin Login
          </Link>
          
          <Link href="/login/worker" className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:text-lg transition-colors">
            Worker Login
          </Link>
        </div>
        
        <div className="text-center mt-4">
          <Link href="/" className="text-sm font-medium text-gray-600 hover:text-gray-500">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
