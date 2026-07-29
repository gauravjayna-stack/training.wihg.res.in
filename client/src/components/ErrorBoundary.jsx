import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Surfaced in the browser console so it's easy to diagnose in production.
    console.error('WIHG portal crashed:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="max-w-md mx-auto mt-16 bg-white shadow rounded-lg p-6 text-center">
          <h1 className="text-lg font-bold text-red-700 mb-2">Something went wrong</h1>
          <p className="text-sm text-gray-600 mb-4">
            The page hit an unexpected error. Please refresh — if this keeps happening,
            open the browser console (F12) and share the error shown there.
          </p>
          <button
            onClick={() => location.reload()}
            className="bg-wihg-navy text-white rounded px-4 py-2 text-sm font-medium"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
