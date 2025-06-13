import { render, screen } from '@testing-library/react';
import App from './App';

test('renders video call title', () => {
  render(<App />);
  const titleElement = screen.getByText(/Video Call/i);
  expect(titleElement).toBeInTheDocument();
});
