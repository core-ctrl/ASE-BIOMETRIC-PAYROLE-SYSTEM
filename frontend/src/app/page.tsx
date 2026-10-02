import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-900">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Biometric Payroll
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Automated Attendance & Workforce Management
          </p>
        </div>
        
        <div className="space-y-4 pt-4">
          <Link href="/biometric" className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:text-lg transition-colors">
            Biometric Terminal
          </Link>
          
          <Link href="/login" className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 md:text-lg transition-colors">
            System Login
          </Link>
        </div>
      </div>
    </div>
  );
}
