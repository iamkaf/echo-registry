'use client';

import { useState } from 'react';
import { APP_CONFIG } from '@/lib/utils/constants';

interface ApiSnippetProps {
  mcVersion: string;
  projects: string[];
}

type SnippetFormat = 'curl' | 'fetch' | 'axios' | 'reqwest' | 'python' | 'java';

export default function ApiSnippet({ mcVersion, projects }: ApiSnippetProps) {
  const [copied, setCopied] = useState(false);
  const [format, setFormat] = useState<SnippetFormat>('curl');

  const generateApiUrl = () => {
    if (projects.length > 0) {
      const projectsQuery = projects.join(',');
      return `/api/versions/dependencies/${mcVersion}?projects=${projectsQuery}`;
    }
    return `/api/versions/dependencies/${mcVersion}`;
  };

  const generateCurlSnippet = () => {
    const url = generateApiUrl();
    return `curl -s "${APP_CONFIG.API_BASE_URL}${url}" | jq '.'`;
  };

  const generateFetchSnippet = () => {
    const url = generateApiUrl();
    return `// JavaScript/TypeScript
const response = await fetch(\`${APP_CONFIG.API_BASE_URL}${url}\`);
const data = await response.json();
console.log(data);`;
  };

  const generateAxiosSnippet = () => {
    const url = generateApiUrl();
    return `// JavaScript with Axios
import axios from 'axios';

const response = await axios.get(\`${APP_CONFIG.API_BASE_URL}${url}\`);
console.log(response.data);`;
  };

  const generateReqwestSnippet = () => {
    const url = generateApiUrl();
    return `// Rust with Reqwest
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let response = reqwest::get("${APP_CONFIG.API_BASE_URL}${url}")
        .await?
        .text();
    println!("{}", response);
    Ok(())
}`;
  };

  const generatePythonSnippet = () => {
    const url = generateApiUrl();
    return `# Python with Requests
import requests

response = requests.get("${APP_CONFIG.API_BASE_URL}${url}")
data = response.json()
print(data)`;
  };

  const generateJavaSnippet = () => {
    const url = generateApiUrl();
    return `// Java 11+ with HttpClient
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class EchoRegistryClient {
    public static void main(String[] args) throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("${APP_CONFIG.API_BASE_URL}${url}"))
                .GET()
                .build();

        HttpResponse<String> response = client.send(request,
                HttpResponse.BodyHandlers.ofString());

        System.out.println(response.body());
    }
}`;
  };

  const getSnippet = () => {
    switch (format) {
      case 'curl':
        return generateCurlSnippet();
      case 'fetch':
        return generateFetchSnippet();
      case 'axios':
        return generateAxiosSnippet();
      case 'reqwest':
        return generateReqwestSnippet();
      case 'python':
        return generatePythonSnippet();
      case 'java':
        return generateJavaSnippet();
      default:
        return generateCurlSnippet();
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getSnippet());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const formatOptions: { value: SnippetFormat; label: string; icon: string }[] = [
    { value: 'curl', label: 'cURL', icon: '🔧' },
    { value: 'fetch', label: 'Fetch API', icon: '🌐' },
    { value: 'axios', label: 'Axios', icon: '⚡' },
    { value: 'reqwest', label: 'Reqwest', icon: '🦀' },
    { value: 'python', label: 'Python', icon: '🐍' },
    { value: 'java', label: 'Java', icon: '☕' },
  ];

  return (
    <div className="bg-gray-900 rounded-lg p-3 lg:p-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
        <h3 className="text-sm font-medium text-gray-300">API Request</h3>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Format Selector */}
          <div className="flex flex-wrap gap-1">
            {formatOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFormat(option.value)}
                className={`text-xs px-2 py-1 rounded transition-all duration-200 ${
                  format === option.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                }`}
                title={option.label}
              >
                <span className="mr-1">{option.icon}</span>
                <span className="hidden sm:inline">{option.label}</span>
              </button>
            ))}
          </div>

          {/* Copy Button */}
          <button
            onClick={copyToClipboard}
            className={`text-xs px-2 py-1 rounded transition-all duration-200 shrink-0 ${
              copied
                ? 'bg-green-600 text-white'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
            }`}
          >
            {copied ? (
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Copied!
              </span>
            ) : (
              'Copy'
            )}
          </button>
        </div>
      </div>

      {/* Code Snippet */}
      <div className="relative">
        <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap break-all leading-relaxed bg-black bg-opacity-50 rounded p-2 lg:p-3">
          {getSnippet()}
        </pre>

        {/* API URL Info */}
        <div className="mt-2 text-xs text-gray-500 border-t border-gray-800 pt-2">
          <div className="flex items-center justify-between">
            <span>Endpoint: <code className="text-gray-400">{generateApiUrl()}</code></span>
            <a
              href={`${APP_CONFIG.API_BASE_URL}/openapi.json`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              API Docs
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}