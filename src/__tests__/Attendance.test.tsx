import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Attendance from '../pages/Attendance';
import { useAppStore } from '../store';

vi.mock('../store', () => ({
  useAppStore: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual as any,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../hooks/useCamera', () => ({
  useCamera: () => ({
    captureImage: vi.fn().mockResolvedValue('data:image/jpeg;base64,mockimage'),
    isCapturing: false,
  })
}));

describe('Attendance Component', () => {
  const mockCheckIn = vi.fn();
  const mockCheckOut = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    const storeState = {
      checkIn: mockCheckIn,
      checkOut: mockCheckOut,
      attendanceHistory: []
    };
    (useAppStore as any).mockImplementation((selector: any) => selector(storeState));
    
    // Mock navigator.geolocation
    const mockGeolocation = {
      getCurrentPosition: vi.fn().mockImplementationOnce((success) => 
        Promise.resolve(success({ coords: { latitude: 51.1, longitude: 45.3 } }))
      )
    };
    (global as any).navigator.geolocation = mockGeolocation;
  });

  it('renders initial check-in state correctly', () => {
    render(
      <MemoryRouter>
        <Attendance />
      </MemoryRouter>
    );
    
    expect(screen.getByText('Absen Masuk')).toBeInTheDocument();
    expect(screen.getByText('Mulai Absen Masuk')).toBeInTheDocument();
  });

  it('progresses to taking photo after getting location', async () => {
    render(
      <MemoryRouter>
        <Attendance />
      </MemoryRouter>
    );

    const startBtn = screen.getByText('Mulai Absen Masuk');
    fireEvent.click(startBtn);

    // Wait for the button to change to "Ambil Foto" since the mock geolocation succeeds immediately
    const photoBtn = await screen.findByText('Ambil Foto');
    expect(photoBtn).toBeInTheDocument();
  });
});
