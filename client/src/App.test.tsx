import React from 'react';
import { render } from '@testing-library/react';
import App from './App';

test('renders "Bills Client Ready" link', () => {
  const { getByText } = render(<App />);
  const linkElement = getByText(/Bills Client Ready/i);
  expect(linkElement).toBeInTheDocument();
});
