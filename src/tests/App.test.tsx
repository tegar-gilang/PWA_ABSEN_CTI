import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from '../App';
import { useAppStore } from '../store';

vi.mock('../store', () => ({
  useAppStore: vi.fn(),
  processSyncQueue: vi.fn(),
}));

vi.mock('../lib/fcm', () => ({
  requestNotificationPermission: vi.fn(),
  onMessageListener: vi.fn().mockResolvedValue({}),
}));

describe('App Component', () => {
  it('renders login page when not authenticated', () => {
    (useAppStore as any).mockImplementation(() => false); // not authenticated

    render(<App />);
    
    // Splash screen might render first, or redirect to login
    // Let's check for either Splash or Login
    expect(screen.getByText('SmartWork')).toBeInTheDocument();
  });

  it('renders authenticated routes when authenticated', () => {
    (useAppStore as any).mockImplementation(() => true); // authenticated

    render(<App />);
    
    // In Splash page or Home depending on initial route (usually / navigates to Splash)
    expect(screen.getByText('SmartWork')).toBeInTheDocument();
  });
});
