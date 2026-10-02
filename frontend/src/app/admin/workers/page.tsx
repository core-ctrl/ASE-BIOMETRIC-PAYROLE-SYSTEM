"use client";

import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';

export default function AdminWorkers() {
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [step, setStep] = useState(1); // 1: Details, 2: Camera
  
  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [workerId, setWorkerId] = useState('');
  const [email, setEmail] = useState('');
  
  // Registration state
  const [newWorkerResponse, setNewWorkerResponse] = useState<any>(null);
  const webcamRef = useRef<Webcam>(null);
  const [faceStatus, setFaceStatus] = useState('Position face inside frame');
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    fetchWorkers();
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models')
      ]);
    } catch (err) {
      console.error("Models not loaded yet", err);
    }
  };

  const fetchWorkers = async () => {
    try {
      const response = await api.get('/workers');
      setWorkers(response.data.data);
    } catch (error) {
      console.error('Failed to fetch workers', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/worker/register', {
        name, phone, workerId, email
      });
      setNewWorkerResponse(response.data.data);
      setStep(2); // Go to face registration
    } catch (error: any) {
      alert(error.response?.data?.message || 'Registration failed');
    }
  };

  const captureAndRegisterFace = async () => {
    if (webcamRef.current && webcamRef.current.video) {
      setIsScanning(true);
      setFaceStatus('Scanning face...');
      
      try {
        const detection = await faceapi.detectSingleFace(webcamRef.current.video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor();
          
        if (!detection) {
          setFaceStatus('No face detected. Try again.');
          setIsScanning(false);
          return;
        }
        
        const embedding = Array.from(detection.descriptor);
        
        await api.post('/biometric/register', {
          workerId: newWorkerResponse.workerId,
          embedding
        });
        
        setFaceStatus('Face registered successfully!');
        
        setTimeout(() => {
          setIsRegistering(false);
          setStep(1);
          setName(''); setPhone(''); setWorkerId(''); setEmail('');
          fetchWorkers();
        }, 2000);
        
      } catch (error) {
        setFaceStatus('Error processing face');
        setIsScanning(false);
      }
    }
  };

  if (loading) return <div>Loading workers...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Workers</h1>
        <button 
          onClick={() => setIsRegistering(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
        >
          + Register Worker
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50">
            <tr>
              <th className="px-6 py-4">Worker ID</th>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Phone</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Face Reg.</th>
            </tr>
          </thead>
          <tbody>
            {workers.map((worker) => (
              <tr key={worker._id} className="border-b">
                <td className="px-6 py-4 font-medium text-gray-900">{worker.workerId}</td>
                <td className="px-6 py-4">{worker.name}</td>
                <td className="px-6 py-4">{worker.phone}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${worker.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {worker.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {worker.faceEmbedding && worker.faceEmbedding.length > 0 ? (
                    <span className="text-green-600">✓ Registered</span>
                  ) : (
                    <span className="text-red-500">Missing</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Registration Modal */}
      {isRegistering && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full">
            {step === 1 ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Register New Worker</h2>
                  <button onClick={() => setIsRegistering(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                </div>
                <form onSubmit={handleRegisterDetails} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input required type="text" value={name} onChange={e=>setName(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input required type="text" value={phone} onChange={e=>setPhone(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Worker ID</label>
                    <input required type="text" value={workerId} onChange={e=>setWorkerId(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email (optional)</label>
                    <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white rounded-md py-2 font-medium hover:bg-blue-700">
                    Next: Face Registration
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center">
                <h2 className="text-xl font-bold mb-2">Face Registration</h2>
                <p className="text-sm text-gray-600 mb-4">Worker account created. Initial password: <span className="font-mono font-bold text-black bg-gray-100 px-2 py-1">{newWorkerResponse?.initialPassword}</span></p>
                
                <div className="relative w-64 h-64 mx-auto rounded-full overflow-hidden border-4 border-gray-300 mb-4 bg-black">
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{ width: 256, height: 256, facingMode: "user" }}
                    className="absolute top-0 left-0 w-full h-full object-cover"
                  />
                  {isScanning && <div className="absolute inset-0 border-4 border-blue-500 rounded-full animate-pulse z-10 pointer-events-none"></div>}
                </div>
                
                <p className="mb-4 font-medium text-blue-600">{faceStatus}</p>
                
                <button 
                  onClick={captureAndRegisterFace}
                  disabled={isScanning}
                  className="w-full bg-indigo-600 text-white rounded-md py-2 font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  Capture & Save Face
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
