import { useState, useEffect } from 'react';

export default function App() {
    const [status, setStatus] = useState<string>('Loading...');

    useEffect(() => {
        fetch('/api/health')
            .then((res) => res.json() as Promise<{ status: string }>)
            .then((data) => {
                setStatus(data.status === 'ok' ? '✅ API Connected' : `⚠️ API ${data.status}`);
            })
            .catch(() => {
                setStatus('❌ API Unreachable');
            });
    }, []);

    return (
        <main className="min-h-screen bg-gray-950 flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-white mb-4">Echo Registry</h1>
                <p className="text-gray-400 mb-2">
                    Popular Minecraft mod loader dependencies
                </p>
                <p className="text-sm text-gray-500">{status}</p>
                <p className="text-xs text-gray-600 mt-8">UI redesign coming soon</p>
            </div>
        </main>
    );
}
