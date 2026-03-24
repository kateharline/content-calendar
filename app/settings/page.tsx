'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { isSupabaseAvailable } from '@/lib/supabase';

export default function SettingsPage() {
  const [accountId, setAccountId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [username, setUsername] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [supabaseConnected, setSupabaseConnected] = useState(false);

  useEffect(() => {
    setSupabaseConnected(isSupabaseAvailable());

    // Load saved credentials from localStorage as backup
    try {
      const saved = localStorage.getItem('frequency_ig_credentials');
      if (saved) {
        const creds = JSON.parse(saved);
        setAccountId(creds.accountId || '');
        setAccessToken(creds.accessToken || '');
        setUsername(creds.username || null);
      }
    } catch {
      // Ignore
    }
  }, []);

  const handleTestConnection = async () => {
    if (!accountId || !accessToken) {
      setTestResult({ success: false, message: 'Please enter both Account ID and Access Token' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/instagram/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, accessToken }),
      });

      const data = await res.json();

      if (data.success) {
        setUsername(data.username);
        setTestResult({ success: true, message: `Connected as @${data.username} (${data.name})` });
      } else {
        setTestResult({ success: false, message: data.error || 'Connection failed' });
      }
    } catch (err) {
      setTestResult({ success: false, message: `Network error: ${err}` });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    // Save to localStorage
    try {
      localStorage.setItem('frequency_ig_credentials', JSON.stringify({
        accountId,
        accessToken,
        username,
      }));
    } catch {
      // Ignore
    }

    // Save to Supabase if available
    if (supabaseConnected) {
      try {
        const { saveIgCredentials } = await import('@/lib/supabase');
        await saveIgCredentials(accountId, accessToken, username || undefined);
      } catch (err) {
        console.error('Failed to save to Supabase:', err);
      }
    }

    setSaving(false);
    setTestResult({ success: true, message: 'Credentials saved' });
  };

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
              <p className="text-gray-500 mt-1">Configure Instagram publishing</p>
            </div>
            <Link
              href="/review"
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ← Back to Review
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Connection status */}
        <div className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl">
          <div className={`w-3 h-3 rounded-full ${supabaseConnected ? 'bg-green-400' : 'bg-yellow-400'}`} />
          <span className="text-sm text-gray-700">
            Supabase: {supabaseConnected ? 'Connected' : 'Not configured (using localStorage)'}
          </span>
        </div>

        {/* Instagram Credentials */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Instagram Graph API</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instagram Business Account ID
              </label>
              <input
                type="text"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                placeholder="e.g., 17841400123456789"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500 transition-all font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Access Token
              </label>
              <input
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="Your Instagram Graph API access token"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500 transition-all font-mono text-sm"
              />
            </div>

            {username && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Connected as @{username}
              </div>
            )}

            {testResult && (
              <div className={`p-3 rounded-lg text-sm ${testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {testResult.message}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleTestConnection}
                disabled={testing || !accountId || !accessToken}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  testing || !accountId || !accessToken
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {testing ? 'Testing...' : 'Test Connection'}
              </button>

              <button
                onClick={handleSave}
                disabled={saving || !accountId || !accessToken}
                className={`px-5 py-2 rounded-full font-semibold text-sm transition-colors ${
                  saving || !accountId || !accessToken
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
              >
                {saving ? 'Saving...' : 'Save Credentials'}
              </button>
            </div>
          </div>
        </div>

        {/* Setup Guide */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Setup Guide</h2>
          <ol className="space-y-3 text-sm text-gray-600">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-medium text-xs">1</span>
              <span>Create a Meta Developer account and a new app at <code className="text-pink-600">developers.facebook.com</code></span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-medium text-xs">2</span>
              <span>Add the Instagram Graph API product to your app</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-medium text-xs">3</span>
              <span>Connect your Instagram Business/Creator account to a Facebook Page</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-medium text-xs">4</span>
              <span>Generate a long-lived access token with <code className="text-pink-600">instagram_basic</code>, <code className="text-pink-600">instagram_content_publish</code>, and <code className="text-pink-600">pages_read_engagement</code> permissions</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-medium text-xs">5</span>
              <span>Find your Instagram Business Account ID from the API Explorer or your app dashboard</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-medium text-xs">6</span>
              <span>Enter both values above and click &quot;Test Connection&quot;</span>
            </li>
          </ol>
        </div>
      </main>
    </div>
  );
}
