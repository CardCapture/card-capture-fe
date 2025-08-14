import React, { useState } from 'react';
import { TypeaheadInput } from '@/components/ui/TypeaheadInput';

console.log('🔍 TestTypeahead.tsx: File is being imported!');

export const TestTypeahead: React.FC = () => {
  console.log('🔍 TestTypeahead: Component is rendering!');
  const [value, setValue] = useState('');

  console.log('TestTypeahead: Component rendered with value:', value);

  return (
    <div className="p-4 border border-gray-300 m-4">
      <h3 className="text-lg font-bold mb-2">Typeahead Test Component</h3>
      <p className="text-sm text-gray-600 mb-4">
        Current value: "{value}" (length: {value.length})
      </p>
      
      <TypeaheadInput
        label="Test School Search"
        value={value}
        onChange={(newValue) => {
          console.log('TestTypeahead: onChange called with:', newValue);
          setValue(newValue);
        }}
        searchEndpoint="/high-schools/search"
        displayField="name"
        placeholder="Type to search schools..."
      />
      
      <div className="mt-4 text-xs text-gray-500">
        Try typing "Albert" or "High" to test the search
      </div>
    </div>
  );
};