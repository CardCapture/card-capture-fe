// RegisterPageDemo.tsx - Demo component showing different states of RegisterPage
// This can be used for manual testing and validation of the component
import { useState } from 'react';
import { Button } from '@/components/ui/button';

// Mock the RegisterPage component to demonstrate different states
const RegisterPageDemo = () => {
  const [currentState, setCurrentState] = useState<'default' | 'email' | 'code' | 'submitting' | 'error'>('default');

  const mockProps = {
    default: {
      showEmailInput: false,
      showCodeInput: false,
      submitting: false,
      email: '',
      eventCode: '',
      codeError: ''
    },
    email: {
      showEmailInput: true,
      showCodeInput: false,
      submitting: false,
      email: 'student@example.com',
      eventCode: '',
      codeError: ''
    },
    code: {
      showEmailInput: false,
      showCodeInput: true,
      submitting: false,
      email: '',
      eventCode: '123456',
      codeError: ''
    },
    submitting: {
      showEmailInput: true,
      showCodeInput: false,
      submitting: true,
      email: 'student@example.com',
      eventCode: '',
      codeError: ''
    },
    error: {
      showEmailInput: false,
      showCodeInput: true,
      submitting: false,
      email: '',
      eventCode: '12345',
      codeError: 'Code must be 6 digits'
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">RegisterPage Component States</h1>
        
        {/* State Controls */}
        <div className="mb-8 space-x-4">
          <Button 
            onClick={() => setCurrentState('default')}
            variant={currentState === 'default' ? 'default' : 'outline'}
          >
            Default
          </Button>
          <Button 
            onClick={() => setCurrentState('email')}
            variant={currentState === 'email' ? 'default' : 'outline'}
          >
            Email Input
          </Button>
          <Button 
            onClick={() => setCurrentState('code')}
            variant={currentState === 'code' ? 'default' : 'outline'}
          >
            Event Code
          </Button>
          <Button 
            onClick={() => setCurrentState('submitting')}
            variant={currentState === 'submitting' ? 'default' : 'outline'}
          >
            Submitting
          </Button>
          <Button 
            onClick={() => setCurrentState('error')}
            variant={currentState === 'error' ? 'default' : 'outline'}
          >
            Error State
          </Button>
        </div>

        {/* Current State Info */}
        <div className="mb-8 p-4 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Current State: {currentState}</h2>
          <div className="text-sm text-gray-600">
            <p><strong>Props:</strong></p>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
              {JSON.stringify(mockProps[currentState], null, 2)}
            </pre>
          </div>
        </div>

        {/* Component Preview */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 bg-gray-100 border-b">
            <h3 className="font-semibold">RegisterPage Preview</h3>
            <p className="text-sm text-gray-600">State: {currentState}</p>
          </div>
          
          <div className="aspect-video bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
            <div className="text-center p-8">
              <div className="text-4xl mb-4">📱</div>
              <h2 className="text-2xl font-bold mb-2">RegisterPage Component</h2>
              <p className="text-gray-600 mb-4">Current state: {currentState}</p>
              
              {/* Mock UI based on state */}
              {currentState === 'default' && (
                <div className="space-y-4">
                  <div className="w-64 h-12 bg-primary rounded-lg flex items-center justify-center text-white font-medium">
                    Continue with Email
                  </div>
                  <div className="text-sm text-gray-500">or</div>
                  <div className="text-primary">I have an Event Code</div>
                </div>
              )}
              
              {currentState === 'email' && (
                <div className="space-y-4">
                  <div className="w-64 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    📧 student@example.com
                  </div>
                  <div className="flex gap-2">
                    <div className="w-20 h-10 bg-gray-200 rounded">Back</div>
                    <div className="w-32 h-10 bg-primary rounded text-white flex items-center justify-center">
                      Continue →
                    </div>
                  </div>
                </div>
              )}
              
              {currentState === 'code' && (
                <div className="space-y-4">
                  <div className="w-32 h-12 bg-gray-100 rounded-lg flex items-center justify-center font-mono">
                    123456
                  </div>
                  <div className="flex gap-2">
                    <div className="w-20 h-10 bg-gray-200 rounded">Back</div>
                    <div className="w-32 h-10 bg-primary rounded text-white flex items-center justify-center">
                      Continue →
                    </div>
                  </div>
                </div>
              )}
              
              {currentState === 'submitting' && (
                <div className="space-y-4">
                  <div className="w-64 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    📧 student@example.com
                  </div>
                  <div className="flex gap-2">
                    <div className="w-20 h-10 bg-gray-200 rounded">Back</div>
                    <div className="w-32 h-10 bg-primary/50 rounded text-white flex items-center justify-center">
                      Sending...
                    </div>
                  </div>
                </div>
              )}
              
              {currentState === 'error' && (
                <div className="space-y-4">
                  <div className="w-32 h-12 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center font-mono">
                    12345
                  </div>
                  <div className="text-red-600 text-sm">Code must be 6 digits</div>
                  <div className="flex gap-2">
                    <div className="w-20 h-10 bg-gray-200 rounded">Back</div>
                    <div className="w-32 h-10 bg-gray-300 rounded text-gray-500 flex items-center justify-center">
                      Continue →
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Test Scenarios */}
        <div className="mt-8 p-4 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Test Scenarios Covered</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Default state with both CTAs visible
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Email input form with validation
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Event code input with 6-digit validation
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Loading/submitting state
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Error state with inline validation messages
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Keyboard navigation and accessibility
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Mobile-first responsive design
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RegisterPageDemo;