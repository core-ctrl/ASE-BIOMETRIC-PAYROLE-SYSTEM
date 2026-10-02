"use client";

import { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';

export default function BiometricAttendance() {
  const webcamRef = useRef<Webcam>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [status, setStatus] = useState<'IDLE' | 'SCANNING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [message, setMessage] = useState('Select an action to start camera');
  const [resultData, setResultData] = useState<any>(null);
  const [selectedAction, setSelectedAction] = useState<'PUNCH_IN' | 'PUNCH_OUT' | null>(null);
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models')
        ]);
        setModelsLoaded(true);
        setMessage('Ready. Select an action below.');
      } catch (err) {
        console.error("Error loading models", err);
        setMessage('Error loading face recognition models');
        setStatus('ERROR');
      }
    };
    loadModels();
  }, []);

  const handleScan = async (action: 'PUNCH_IN' | 'PUNCH_OUT') => {
    if (!modelsLoaded || status === 'SCANNING') return;
    
    setSelectedAction(action);
    setStatus('SCANNING');
    setMessage(`Scanning for ${action === 'PUNCH_IN' ? 'Punch In' : 'Punch Out'}...`);

    // Add a small delay to let user position face
    setTimeout(async () => {
      if (webcamRef.current && webcamRef.current.video) {
        const video = webcamRef.current.video;
        
        try {
          const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptor();

          if (!detection) {
            setStatus('ERROR');
            setMessage('Face not recognized. Please position correctly.');
            setTimeout(() => {
              setStatus('IDLE');
              setMessage('Ready. Select an action below.');
              setSelectedAction(null);
            }, 3000);
            return;
          }

          // Send embedding to backend
          const embedding = Array.from(detection.descriptor);
          
          const response = await api.post('/biometric/recognize', { embedding, action });
          
          if (response.data.success) {
            setStatus('SUCCESS');
            setMessage(`✓ ${action === 'PUNCH_IN' ? 'Punch In' : 'Punch Out'} Successful`);
            setResultData(response.data.data);
            
            setTimeout(() => {
              setStatus('IDLE');
              setMessage('Ready. Select an action below.');
              setResultData(null);
              setSelectedAction(null);
            }, 5000);
          }
        } catch (error: any) {
          setStatus('ERROR');
          
          const errorMsg = error.response?.data?.message || 'Action failed';
          setMessage(errorMsg);

          setTimeout(() => {
            setStatus('IDLE');
            setMessage('Ready. Select an action below.');
            setSelectedAction(null);
          }, 4000);
        }
      }
    }, 1500); // Wait 1.5 seconds before capturing
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white relative">
      <div className="absolute top-8 text-center w-full">
        <h1 className="text-3xl font-bold tracking-widest text-gray-200">BIOMETRIC ATTENDANCE</h1>
        <p className="mt-2 text-xl text-gray-400">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      <div className="relative w-[400px] h-[400px] mt-16 rounded-full overflow-hidden border-4 border-gray-700 shadow-2xl bg-black">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={{ width: 400, height: 400, facingMode: "user" }}
          className="absolute top-0 left-0 w-full h-full object-cover"
        />
        
        {/* Overlay scanning animation */}
        {status === 'SCANNING' && (
          <div className={`absolute inset-0 border-4 rounded-full animate-pulse z-10 box-border pointer-events-none ${selectedAction === 'PUNCH_IN' ? 'border-blue-500' : 'border-purple-500'}`}></div>
        )}
        
        {/* Overlay Success */}
        {status === 'SUCCESS' && (
           <div className="absolute inset-0 border-4 border-green-500 rounded-full z-10 box-border pointer-events-none"></div>
        )}
        
        {/* Overlay Error */}
        {status === 'ERROR' && (
           <div className="absolute inset-0 border-4 border-red-500 rounded-full z-10 box-border pointer-events-none"></div>
        )}
      </div>

      <div className="mt-8 flex gap-6">
        <button 
          onClick={() => handleScan('PUNCH_IN')}
          disabled={status !== 'IDLE'}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-lg shadow-lg transition-transform transform active:scale-95"
        >
          Start Shift (Punch In)
        </button>
        <button 
          onClick={() => handleScan('PUNCH_OUT')}
          disabled={status !== 'IDLE'}
          className="px-8 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold rounded-lg shadow-lg transition-transform transform active:scale-95"
        >
          End Shift (Punch Out)
        </button>
      </div>

      <div className="mt-6 text-center h-24 flex flex-col items-center justify-center">
        <h2 className={`text-xl font-semibold mb-2 transition-colors ${
          status === 'SUCCESS' ? 'text-green-400' : 
          status === 'ERROR' ? 'text-red-400' : 
          status === 'SCANNING' ? (selectedAction === 'PUNCH_IN' ? 'text-blue-400' : 'text-purple-400') : 'text-gray-300'
        }`}>
          {message}
        </h2>
        
        {resultData && status === 'SUCCESS' && (
          <div className="text-gray-300 animate-fade-in">
            <p className="text-lg">Welcome, <span className="font-bold text-white">{resultData.workerName}</span></p>
            <p>{resultData.type === 'PUNCH_IN' ? 'Punch-in recorded successfully' : 'Punch-out recorded successfully'}</p>
          </div>
        )}
      </div>
      
      <div className="absolute bottom-8 flex flex-col items-center gap-4">
        <a href="/" className="text-gray-500 hover:text-gray-300 text-sm">
          Return to Home
        </a>
        
        {user && (
          <button 
            onClick={() => {
              logout();
              router.push('/login');
            }}
            className="text-red-500 hover:text-red-400 text-sm font-medium border border-red-500/30 px-4 py-1 rounded-full transition-colors"
          >
            Sign Out ({user.role})
          </button>
        )}
      </div>
    </div>
  );
}
