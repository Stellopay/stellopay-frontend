import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AccountSection, {
  DEFAULT_PROFILE,
  isProfileComplete,
  countCompletedProfileFields,
  totalProfileFields,
  type ProfileData,
} from './account-section';

// ── Mocks ──────────────────────────────────────────────────────────────────

// Mock the separate API module so we can control success/failure in each test.
const mockSaveProfile = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api/profile', () => ({
  saveProfile: mockSaveProfile,
}));

// Mock sonner toast to avoid side-effects during unit tests.
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Stub localStorage since it may not be available in all jsdom configurations.
const localStorageMock = vi.hoisted(() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
});

vi.stubGlobal('localStorage', localStorageMock);

// next/image is not available under jsdom.
vi.mock('next/image', () => ({
  default: ({
    alt,
    priority: _priority,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...props} />
  ),
}));

// ── Helpers ────────────────────────────────────────────────────────────────

function renderAccount(
  overrides?: Partial<{
    profile: ProfileData;
    onProfileChange: ReturnType<typeof vi.fn>;
  }>,
) {
  const profile = overrides?.profile ?? DEFAULT_PROFILE;
  const onProfileChange = overrides?.onProfileChange ?? vi.fn();
  return render(
    <AccountSection profile={profile} onProfileChange={onProfileChange} />,
  );
}

// ── Component-level exports ────────────────────────────────────────────────

describe('exported helper functions', () => {
  it('exports DEFAULT_PROFILE with all fields populated', () => {
    expect(DEFAULT_PROFILE).toMatchObject({
      firstName: expect.any(String),
      lastName: expect.any(String),
      displayName: expect.any(String),
      email: expect.any(String),
      timezone: expect.any(String),
      currency: expect.any(String),
      legalEntity: expect.any(String),
      billingCountry: expect.any(String),
    });
  });

  it('isProfileComplete returns true when every field is non-empty', () => {
    expect(isProfileComplete(DEFAULT_PROFILE)).toBe(true);
  });

  it('isProfileComplete returns false when any field is empty', () => {
    expect(
      isProfileComplete({ ...DEFAULT_PROFILE, firstName: '' }),
    ).toBe(false);
  });

  it('countCompletedProfileFields returns the number of non-empty fields', () => {
    expect(countCompletedProfileFields(DEFAULT_PROFILE)).toBe(8);
    expect(
      countCompletedProfileFields({ ...DEFAULT_PROFILE, firstName: '', lastName: '' }),
    ).toBe(6);
  });

  it('totalProfileFields matches the DEFAULT_PROFILE key count', () => {
    expect(totalProfileFields()).toBe(8);
  });
});

// ── Profile rendering & editing ────────────────────────────────────────────

describe('AccountSection – profile editing', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders all profile fields with their current values', () => {
    renderAccount();

    expect(screen.getByLabelText('First Name')).toHaveValue(
      DEFAULT_PROFILE.firstName,
    );
    expect(screen.getByLabelText('Last Name')).toHaveValue(
      DEFAULT_PROFILE.lastName,
    );
    expect(screen.getByLabelText('Display Name')).toHaveValue(
      DEFAULT_PROFILE.displayName,
    );
    expect(screen.getByLabelText('Email')).toHaveValue(DEFAULT_PROFILE.email);
    expect(screen.getByLabelText('Timezone')).toHaveValue(
      DEFAULT_PROFILE.timezone,
    );
    expect(screen.getByLabelText('Currency')).toHaveValue(
      DEFAULT_PROFILE.currency,
    );
    expect(screen.getByLabelText('Legal Entity')).toHaveValue(
      DEFAULT_PROFILE.legalEntity,
    );
    expect(screen.getByLabelText('Billing Country')).toHaveValue(
      DEFAULT_PROFILE.billingCountry,
    );
  });

  it('calls onProfileChange when a field is edited', () => {
    const onProfileChange = vi.fn();
    renderAccount({ onProfileChange });

    const firstNameInput = screen.getByLabelText('First Name');
    fireEvent.change(firstNameInput, { target: { value: 'Jane' } });

    expect(onProfileChange).toHaveBeenCalledWith(
      expect.objectContaining({ firstName: 'Jane' }),
    );
  });

  it('renders a save button', () => {
    renderAccount();

    expect(
      screen.getByRole('button', { name: /save changes/i }),
    ).toBeInTheDocument();
  });
});

// ── Cookie preferences ─────────────────────────────────────────────────────

describe('AccountSection – cookie preferences', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders cookie preferences categories correctly', () => {
    renderAccount();
    expect(screen.getByText('Cookie Preferences')).toBeInTheDocument();
    expect(screen.getByText('Essential Cookies')).toBeInTheDocument();
    expect(screen.getByText('Analytics Cookies')).toBeInTheDocument();
    expect(screen.getByText('Marketing Cookies')).toBeInTheDocument();
  });

  it('allows toggling analytics and marketing options', () => {
    renderAccount();
    const analyticsCheckbox = screen.getByLabelText(
      'Analytics cookies toggle',
    ) as HTMLInputElement;
    const marketingCheckbox = screen.getByLabelText(
      'Marketing cookies toggle',
    ) as HTMLInputElement;

    expect(analyticsCheckbox.checked).toBe(false);
    fireEvent.click(analyticsCheckbox);
    expect(analyticsCheckbox.checked).toBe(true);

    expect(marketingCheckbox.checked).toBe(false);
    fireEvent.click(marketingCheckbox);
    expect(marketingCheckbox.checked).toBe(true);
  });

  it('persists cookie preferences to localStorage on save', () => {
    renderAccount();

    fireEvent.click(screen.getByLabelText('Analytics cookies toggle'));
    fireEvent.click(
      screen.getByRole('button', { name: /save cookie preferences/i }),
    );

    expect(localStorage.getItem('stellopay_cookie_preferences')).toBe(
      JSON.stringify({ essential: true, analytics: true, marketing: false }),
    );
  });
});

// ── Avatar upload validation ───────────────────────────────────────────────

describe('AccountSection – avatar upload validation', () => {
  const getFileInput = () => screen.getByTestId('avatar-upload-input');

  afterEach(() => {
    cleanup();
  });

  it('shows an error when the file is not an accepted image type', () => {
    renderAccount();
    const fileInput = getFileInput();
    const file = new File(['dummy content'], 'test.pdf', {
      type: 'application/pdf',
    });

    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(
      screen.getByText(/Please select a valid image file/i),
    ).toBeInTheDocument();
  });

  it('shows an error when the file exceeds 5MB', () => {
    renderAccount();
    const fileInput = getFileInput();
    const file = new File(['content'], 'large.png', { type: 'image/png' });
    Object.defineProperty(file, 'size', { value: 6 * 1024 * 1024 });

    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(
      screen.getByText(/File size must be less than 5MB/i),
    ).toBeInTheDocument();
  });

  it('shows a success status for a valid image', () => {
    renderAccount();
    const fileInput = getFileInput();
    const file = new File(['content'], 'avatar.png', { type: 'image/png' });
    Object.defineProperty(file, 'size', { value: 1024 * 1024 });

    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(
      screen.getByText(/Photo staged for upload/i),
    ).toBeInTheDocument();
  });
});

// ── Optimistic save: success path ──────────────────────────────────────────

describe('AccountSection – optimistic save (success)', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    mockSaveProfile.mockReset();
  });

  it('shows a saving indicator immediately on save click', async () => {
    mockSaveProfile.mockImplementationOnce(
      () => new Promise(() => {}), // never resolves
    );

    renderAccount();

    fireEvent.click(screen.getByRole('button', { name: /^save changes$/i }));

    // The button text should change to "Saving…"
    const saveButton = screen.getByRole('button', {
      name: /saving/i,
    });
    expect(saveButton).toBeInTheDocument();
    expect(saveButton).toBeDisabled();
  });

  it('keeps the edited value in place after a successful save', async () => {
    mockSaveProfile.mockResolvedValueOnce(undefined);

    const onProfileChange = vi.fn();
    const { rerender } = render(
      <AccountSection profile={DEFAULT_PROFILE} onProfileChange={onProfileChange} />,
    );

    // Simulate parent re-render when onProfileChange is called
    onProfileChange.mockImplementation((updatedProfile: ProfileData) => {
      rerender(
        <AccountSection
          profile={updatedProfile}
          onProfileChange={onProfileChange}
        />,
      );
    });

    // Edit the display name
    const displayNameInput = screen.getByLabelText('Display Name');
    fireEvent.change(displayNameInput, { target: { value: 'Alice' } });

    // Click save
    fireEvent.click(screen.getByRole('button', { name: /^save changes$/i }));

    // Wait for the save to complete — the "Saved" badge should appear
    await waitFor(() => {
      expect(screen.getByText('Saved')).toBeInTheDocument();
    });

    // The input should still hold the new value (no flicker)
    expect(screen.getByLabelText('Display Name')).toHaveValue('Alice');
  });

  it('displays a success badge after a successful save', async () => {
    mockSaveProfile.mockResolvedValueOnce(undefined);

    renderAccount();

    fireEvent.click(screen.getByRole('button', { name: /^save changes$/i }));

    await waitFor(() => {
      expect(screen.getByText('Saved')).toBeInTheDocument();
    });
  });

  it('does NOT roll back the parent state on a successful save', async () => {
    mockSaveProfile.mockResolvedValueOnce(undefined);

    const onProfileChange = vi.fn();
    renderAccount({ onProfileChange });

    // Edit a field
    fireEvent.change(screen.getByLabelText('First Name'), {
      target: { value: 'Bob' },
    });

    // Clear call history so we only track save-related calls
    onProfileChange.mockClear();

    fireEvent.click(screen.getByRole('button', { name: /^save changes$/i }));

    // Wait for save to complete
    await waitFor(() => {
      expect(mockSaveProfile).toHaveBeenCalledTimes(1);
    });

    // onProfileChange should not have been called again during save (no rollback)
    // The component only calls onProfileChange on field edits + possible rollback.
    // After a successful save there is no rollback, so total calls should be 0.
    expect(onProfileChange).not.toHaveBeenCalled();
  });

  it('disables the save button while saving', () => {
    mockSaveProfile.mockImplementationOnce(
      () => new Promise(() => {}),
    );

    renderAccount();
    const saveBtn = screen.getByRole('button', { name: /^save changes$/i });

    fireEvent.click(saveBtn);

    expect(saveBtn).toBeDisabled();
  });
});

// ── Optimistic save: rollback-on-failure path ──────────────────────────────

describe('AccountSection – rollback on save failure', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    mockSaveProfile.mockReset();
  });

  it('displays an error badge and error message on save failure', async () => {
    mockSaveProfile.mockRejectedValueOnce(new Error('Network error'));

    renderAccount();

    fireEvent.click(screen.getByRole('button', { name: /^save changes$/i }));

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    expect(
      screen.getByText(/failed to save profile/i),
    ).toBeInTheDocument();
  });

  it('rolls back the parent state to the last known good state on failure', async () => {
    mockSaveProfile.mockRejectedValueOnce(new Error('Network error'));

    const parentProfile = { ...DEFAULT_PROFILE };

    // Controlled parent: stores the latest profile and re-renders on change.
    const onProfileChange = vi.fn((updatedProfile: ProfileData) => {
      Object.assign(parentProfile, updatedProfile);
    });

    const { rerender } = render(
      <AccountSection
        profile={parentProfile}
        onProfileChange={onProfileChange}
      />,
    );

    // Override onProfileChange to also rerender
    const changeHandler = vi.fn((updatedProfile: ProfileData) => {
      Object.assign(parentProfile, updatedProfile);
      rerender(
        <AccountSection
          profile={parentProfile}
          onProfileChange={changeHandler}
        />,
      );
    });

    // Re-render with the new handler
    rerender(
      <AccountSection profile={parentProfile} onProfileChange={changeHandler} />,
    );

    // Edit display name (propagates to parent immediately)
    const displayNameInput = screen.getByLabelText('Display Name');
    fireEvent.change(displayNameInput, { target: { value: 'New Display' } });

    // Verify edit propagated
    expect(changeHandler).toHaveBeenCalledWith(
      expect.objectContaining({ displayName: 'New Display' }),
    );
    expect(parentProfile.displayName).toBe('New Display');

    // Clear call history to isolate save-related calls
    changeHandler.mockClear();

    // Click save
    fireEvent.click(screen.getByRole('button', { name: /^save changes$/i }));

    // Wait for the save to fail
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    // The parent should have been rolled back to the last known good state
    expect(parentProfile.displayName).toBe(DEFAULT_PROFILE.displayName);
  });

  it('shows an error toast on save failure', async () => {
    const { toast } = await import('sonner');
    mockSaveProfile.mockRejectedValueOnce(new Error('Network error'));

    renderAccount();

    fireEvent.click(screen.getByRole('button', { name: /^save changes$/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('reverted'),
      );
    });
  });

  it('shows a success toast on successful save', async () => {
    const { toast } = await import('sonner');
    mockSaveProfile.mockResolvedValueOnce(undefined);

    renderAccount();

    fireEvent.click(screen.getByRole('button', { name: /^save changes$/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('saved'),
      );
    });
  });

  it('reverts the displayed input value to the original after rollback', async () => {
    mockSaveProfile.mockRejectedValueOnce(new Error('Network error'));

    const parentProfile = { ...DEFAULT_PROFILE };
    const onProfileChange = vi.fn((updatedProfile: ProfileData) => {
      Object.assign(parentProfile, updatedProfile);
    });

    const { rerender } = render(
      <AccountSection
        profile={parentProfile}
        onProfileChange={onProfileChange}
      />,
    );

    // Create a handler that re-renders the component with updated profile
    const changeHandler = vi.fn((updatedProfile: ProfileData) => {
      Object.assign(parentProfile, updatedProfile);
      rerender(
        <AccountSection
          profile={parentProfile}
          onProfileChange={changeHandler}
        />,
      );
    });

    // Re-render with the proper handler
    rerender(
      <AccountSection
        profile={parentProfile}
        onProfileChange={changeHandler}
      />,
    );

    // Edit the first name
    const firstNameInput = screen.getByLabelText('First Name');
    fireEvent.change(firstNameInput, { target: { value: 'RolledBack' } });

    expect(parentProfile.firstName).toBe('RolledBack');

    // Flush change handler calls
    changeHandler.mockClear();

    // Click save (this will fail and trigger rollback)
    fireEvent.click(screen.getByRole('button', { name: /^save changes$/i }));

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    // The input should now hold the original value from DEFAULT_PROFILE
    expect(screen.getByLabelText('First Name')).toHaveValue(
      DEFAULT_PROFILE.firstName,
    );
  });
});
