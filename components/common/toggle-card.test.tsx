import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ToggleCard from './toggle-card';

describe('ToggleCard Accessibility', () => {
  it('exposes aria-pressed and aria-checked attributes that flip on toggle', () => {
    const handleToggle = vi.fn();
    const { rerender } = render(
      <ToggleCard title="Notifications" enabled={false} onToggle={handleToggle} />
    );
    
    const button = screen.getByRole('switch');
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(button).toHaveAttribute('aria-checked', 'false');
    expect(button).toHaveAttribute('aria-label', 'Notifications, disabled');
    
    // Simulate clicking the toggle which triggers the handler
    fireEvent.click(button);
    expect(handleToggle).toHaveBeenCalledWith(true);
    
    // Rerender with new state
    rerender(<ToggleCard title="Notifications" enabled={true} onToggle={handleToggle} />);
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toHaveAttribute('aria-checked', 'true');
    expect(button).toHaveAttribute('aria-label', 'Notifications, enabled');
  });

  it('activates the toggle via Space and Enter keys', () => {
    const handleToggle = vi.fn();
    render(<ToggleCard title="Notifications" enabled={false} onToggle={handleToggle} />);
    
    const button = screen.getByRole('switch');
    
    fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
    expect(handleToggle).toHaveBeenCalledWith(true);
    
    fireEvent.keyDown(button, { key: ' ', code: 'Space' });
    expect(handleToggle).toHaveBeenCalledTimes(2);
  });

  it('does not trigger onToggle when disabled', () => {
    const handleToggle = vi.fn();
    render(<ToggleCard title="Notifications" enabled={false} disabled={true} onToggle={handleToggle} />);
    
    const button = screen.getByRole('switch');
    expect(button).toBeDisabled();
    
    fireEvent.click(button);
    expect(handleToggle).not.toHaveBeenCalled();
  });
  
  it('handles rapid toggles properly', () => {
    const handleToggle = vi.fn();
    render(<ToggleCard title="Notifications" enabled={false} onToggle={handleToggle} />);
    const button = screen.getByRole('switch');
    
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);
    
    expect(handleToggle).toHaveBeenCalledTimes(3);
  });
});
