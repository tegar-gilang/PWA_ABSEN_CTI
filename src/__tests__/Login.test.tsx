import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Login from '../pages/Login';
import { useAppStore } from '../store';

vi.mock('../store', () => ({
  useAppStore: vi.fn(),
  MOCK_USER: {
    employeeId: 'EMP-001',
    name: 'Test User',
    position: 'Tester',
    department: 'QA',
    schedule: '09:00 - 17:00'
  }
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual as any,
    useNavigate: () => mockNavigate,
  };
});

describe('Login Component', () => {
  const mockLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAppStore as any).mockReturnValue(mockLogin);
  });

  it('renders login form correctly', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    
    expect(screen.getByText('SmartWork')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('contoh: EMP-0042')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  it('submits form and navigates on success', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    
    const idInput = screen.getByPlaceholderText('contoh: EMP-0042');
    const pwdInput = screen.getByPlaceholderText('••••••••');
    const submitBtn = screen.getByRole('button', { name: /Masuk/i });

    fireEvent.change(idInput, { target: { value: 'EMP-123' } });
    fireEvent.change(pwdInput, { target: { value: 'password123' } });
    
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/home', { replace: true });
    });
  });
});
