import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { GlossaryDialog } from '@/components/GlossaryDialog';

describe('GlossaryDialog', () => {
  it('open 时渲染术语列表', () => {
    render(<GlossaryDialog open onClose={() => {}} />);
    expect(screen.getByRole('dialog', { name: '星际航行术语' })).toBeInTheDocument();
    expect(screen.getByText('γ · 洛伦兹因子')).toBeInTheDocument();
    expect(screen.getByText('自由漂流')).toBeInTheDocument();
  });

  it('close 时不渲染', () => {
    render(<GlossaryDialog open={false} onClose={() => {}} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('点击知道了触发 onClose', () => {
    const onClose = vi.fn();
    render(<GlossaryDialog open onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: '知道了' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('按 Escape 触发 onClose', () => {
    const onClose = vi.fn();
    render(<GlossaryDialog open onClose={onClose} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
