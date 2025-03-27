import React from 'react';
import { render } from '@testing-library/react';
import App from './App';

// Mock react-router-dom to prevent route-related errors in tests
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Routes: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Route: () => <div />,
}));

test('renders the App component without crashing', () => {
  const { container } = render(<App />);
  expect(container).toBeTruthy();
});
