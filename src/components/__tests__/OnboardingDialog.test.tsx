import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { OnboardingDialog } from '@/components/OnboardingDialog';

describe('OnboardingDialog 首次引导', () => {
  it('渲染第 1 页，共 4 个进度点', () => {
    render(<OnboardingDialog onComplete={() => {}} />);
    expect(screen.getByRole('heading', { name: '专注，就是星际旅行' })).toBeInTheDocument();
    expect(screen.getByTestId('onboarding-dots').children).toHaveLength(4);
    expect(screen.getByRole('button', { name: '上一步' })).toBeDisabled();
  });

  it('点下一步逐页前进，最后一页显示开始航行', () => {
    render(<OnboardingDialog onComplete={() => {}} />);
    fireEvent.click(screen.getByTestId('onboarding-next'));
    expect(screen.getByRole('heading', { name: '选目的地，或设时间' })).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('onboarding-next'));
    expect(screen.getByRole('heading', { name: '时间膨胀效应' })).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('onboarding-next'));
    expect(screen.getByRole('heading', { name: '启程' })).toBeInTheDocument();
    expect(screen.getByTestId('onboarding-start')).toBeInTheDocument();
    expect(screen.queryByTestId('onboarding-next')).not.toBeInTheDocument();
  });

  it('最后一页点开始航行触发 onComplete', () => {
    const onComplete = vi.fn();
    render(<OnboardingDialog onComplete={onComplete} />);
    for (let i = 0; i < 3; i++) fireEvent.click(screen.getByTestId('onboarding-next'));
    fireEvent.click(screen.getByTestId('onboarding-start'));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('点跳过触发 onComplete', () => {
    const onComplete = vi.fn();
    render(<OnboardingDialog onComplete={onComplete} />);
    fireEvent.click(screen.getByRole('button', { name: '跳过' }));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('按 Escape 触发 onComplete', () => {
    const onComplete = vi.fn();
    render(<OnboardingDialog onComplete={onComplete} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
