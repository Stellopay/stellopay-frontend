import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AccountSection } from './account-section';

describe('AccountSection Component - Cookie Preferences', () => {
  it('renders cookie preferences categories correctly', () => {
    render(<AccountSection />);
    expect(screen.getByText('Cookie Preferences')).toBeInTheDocument();
    expect(screen.getByText('Essential Cookies')).toBeInTheDocument();
    expect(screen.getByText('Analytics Cookies')).toBeInTheDocument();
    expect(screen.getByText('Marketing Cookies')).toBeInTheDocument();
  });

  it('allows toggling analytics and marketing options', () => {
    render(<AccountSection />);
    const analyticsCheckbox = screen.getByLabelText('Analytics cookies toggle') as HTMLInputElement;
    const marketingCheckbox = screen.getByLabelText('Marketing cookies toggle') as HTMLInputElement;

    expect(analyticsCheckbox.checked).toBe(false);
    fireEvent.click(analyticsCheckbox);
    expect(analyticsCheckbox.checked).toBe(true);

    expect(marketingCheckbox.checked).toBe(false);
    fireEvent.click(marketingCheckbox);
    expect(marketingCheckbox.checked).toBe(true);
  });
});

describe("AccountSection avatar upload validation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  const getFileInput = () => screen.getByTestId("avatar-upload-input");

  it("shows an error when the file is not an accepted image type", () => {
    render(<AccountSection />);
    const fileInput = getFileInput();
    const file = new File(["dummy content"], "test.pdf", { type: "application/pdf" });
    
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(screen.getByText(/Please select a valid image file/i)).toBeInTheDocument();
  });

  it("shows an error when the file exceeds 5MB", () => {
    render(<AccountSection />);
    const fileInput = getFileInput();
    const file = new File(["content"], "large.png", { type: "image/png" });
    Object.defineProperty(file, "size", { value: 6 * 1024 * 1024 });
    
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(screen.getByText(/File size must be less than 5MB/i)).toBeInTheDocument();
  });

  it("shows a success status for a valid image", () => {
    render(<AccountSection />);
    const fileInput = getFileInput();
    const file = new File(["content"], "avatar.png", { type: "image/png" });
    Object.defineProperty(file, "size", { value: 1024 * 1024 });
    
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(screen.getByText(/Photo staged for upload/i)).toBeInTheDocument();
  });
});
