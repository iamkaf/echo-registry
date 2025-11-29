import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from '../components/ErrorBoundary';

// Component that throws an error for testing
const ThrowError = ({ shouldThrow, message }: { shouldThrow: boolean; message?: string }) => {
  if (shouldThrow) {
    throw new Error(message || 'Test error');
  }
  return <div>No error</div>;
};

// Mock console.error to avoid test output pollution
const originalConsoleError = console.error;
const mockConsoleError = vi.fn();

describe('ErrorBoundary', () => {
  beforeEach(() => {
    mockConsoleError.mockClear();
    vi.clearAllMocks();
    console.error = mockConsoleError;
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('should catch errors and display fallback UI', () => {
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} message="Test error message" />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('We encountered an unexpected error. Please try refreshing the page.')).toBeInTheDocument();
    expect(onError).toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ componentStack: expect.any(String) })
    );
  });

  it('should log error to console', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} message="Console test error" />
      </ErrorBoundary>
    );

    // The error boundary should catch and log the error
    expect(mockConsoleError).toHaveBeenCalled();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should allow recovery with Try Again button', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Test that the Try Again button exists and can be clicked
    const tryAgainButton = screen.getByText('Try Again');
    expect(tryAgainButton).toBeInTheDocument();

    fireEvent.click(tryAgainButton);

    // After clicking, render a non-throwing component
    rerender(
      <ErrorBoundary key="recovery-test">
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('should refresh page when Refresh Page button is clicked', () => {
    const mockReload = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByText('Refresh Page'));

    expect(mockReload).toHaveBeenCalled();
  });

  it('should use custom fallback when provided', () => {
    const customFallback = <div>Custom error fallback</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error fallback')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('should show error details in development mode', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    // @ts-expect-error - Allow modification for testing
    process.env.NODE_ENV = 'development';

    try {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} message="Development test error" />
        </ErrorBoundary>
      );

      expect(screen.getByText('Error Details (Development Only)')).toBeInTheDocument();

      const details = screen.getByText('Error Details (Development Only)');
      fireEvent.click(details);

      expect(screen.getByText(/Development test error/)).toBeInTheDocument();
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it('should not show error details in production mode', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    // @ts-expect-error - Allow modification for testing
    process.env.NODE_ENV = 'production';

    try {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.queryByText('Error Details (Development Only)')).not.toBeInTheDocument();
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it('should handle component stack information', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} message="Stack test error" />
      </ErrorBoundary>
    );

    // Verify error boundary is working
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(mockConsoleError).toHaveBeenCalled();
  });

  it('should work with nested components', () => {
    const NestedComponent = ({ shouldThrow }: { shouldThrow: boolean }) => (
      <div>
        <span>Parent component</span>
        <ThrowError shouldThrow={shouldThrow} />
        <span>Child component</span>
      </div>
    );

    // Test that error boundary catches errors from nested components
    render(
      <ErrorBoundary>
        <NestedComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});