import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Profile from '../pages/Profile';
import { useAppStore } from '../store';

const mockUser = {
  employeeId: 'EMP-001',
  name: 'Test User',
  position: 'Tester',
  department: 'QA',
  schedule: '09:00 - 17:00',
  email: 'test@example.com',
  phone: '1234567890',
  emergencyContact: '0987654321',
  photoUrl: 'http://example.com/photo.jpg'
};

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

describe('Profile Component', () => {
  const mockUpdateProfile = vi.fn();
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAppStore as any).mockImplementation((selector: any) => {
      const state = {
        user: mockUser,
        updateProfile: mockUpdateProfile,
        logout: mockLogout,
      };
      return selector(state);
    });
  });

  it('renders user details correctly', () => {
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );
    
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText(/EMP-001/)).toBeInTheDocument();
    expect(screen.getByText('QA')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('allows editing contact details', async () => {
    mockUpdateProfile.mockResolvedValueOnce(undefined);
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    // Click edit
    const editBtn = screen.getByText('Ubah');
    fireEvent.click(editBtn);

    // Change inputs
    const phoneInput = screen.getByDisplayValue('1234567890');
    fireEvent.change(phoneInput, { target: { value: '1112223333' } });

    // Save
    // Find the save button inside the flex container (usually the last button)
    const saveButtons = screen.getAllByRole('button');
    const saveButton = saveButtons.find(b => b.querySelector('svg.lucide-save'));
    if (saveButton) {
      fireEvent.click(saveButton);
    }
    
    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        phone: '1112223333',
        emergencyContact: '0987654321'
      });
    });
  });

  it('logs out successfully', async () => {
    mockLogout.mockResolvedValueOnce(undefined);
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    const logoutBtn = screen.getByText('Keluar');
    fireEvent.click(logoutBtn);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });
});
