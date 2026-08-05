import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { StarSearch } from '@/components/StarMap/StarSearch';
import { protoToStar, type ProtoStar } from '@/engine/data/star-mapper';

const VEGA: ProtoStar = {
  id: 'hip-91262',
  properName: '织女一 (天琴座 α Vega)',
  bayer: 'α Lyr',
  constellation: 'LYR',
  raDeg: 279.23,
  decDeg: 38.78,
  distanceLy: 25.04,
  vMag: 0.03,
  absMag: 0.58,
  spectral: 'A0Va',
  tier: 'tier2-bright-mag6',
};

const SIRIUS: ProtoStar = {
  id: 'hip-32349',
  properName: '天狼星 A (Sirius)',
  bayer: 'α CMa',
  constellation: 'CMA',
  raDeg: 101.29,
  decDeg: -16.72,
  distanceLy: 8.6,
  vMag: -1.46,
  absMag: 1.42,
  spectral: 'A1V',
  tier: 'tier2-bright-mag6',
};

function renderSearch(status: 'ready' | 'loading' = 'ready') {
  const stars = [protoToStar(VEGA), protoToStar(SIRIUS)];
  const onSelect = vi.fn();
  render(<StarSearch stars={stars} status={status} onSelect={onSelect} />);
  return { onSelect };
}

describe('StarSearch', () => {
  it('输入中文名 → 下拉显示匹配恒星', () => {
    renderSearch();
    fireEvent.change(screen.getByLabelText('搜索恒星'), { target: { value: '织女' } });
    expect(screen.getByTestId('star-search-results')).toBeInTheDocument();
    expect(screen.getByText(/织女一/)).toBeInTheDocument();
  });

  it('输入 HIP 编号 → 下拉显示匹配恒星', () => {
    renderSearch();
    fireEvent.change(screen.getByLabelText('搜索恒星'), { target: { value: '32349' } });
    expect(screen.getByText(/天狼星 A/)).toBeInTheDocument();
  });

  it('无匹配时显示空态文案', () => {
    renderSearch();
    fireEvent.change(screen.getByLabelText('搜索恒星'), { target: { value: '不存在的星' } });
    expect(screen.getByText('未找到匹配恒星')).toBeInTheDocument();
  });

  it('点击结果 → 回调选中恒星并清空查询', () => {
    const { onSelect } = renderSearch();
    fireEvent.change(screen.getByLabelText('搜索恒星'), { target: { value: '织女' } });
    fireEvent.click(screen.getByTestId('star-search-result'));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'hip-91262' }));
    expect(screen.getByLabelText('搜索恒星')).toHaveValue('');
  });

  it('空输入时不显示下拉', () => {
    renderSearch();
    expect(screen.queryByTestId('star-search-results')).not.toBeInTheDocument();
  });

  it('星表加载中显示加载态而非"未找到"', () => {
    renderSearch('loading');
    fireEvent.change(screen.getByLabelText('搜索恒星'), { target: { value: '织女' } });
    expect(screen.getByText('星表加载中…')).toBeInTheDocument();
    expect(screen.queryByText('未找到匹配恒星')).not.toBeInTheDocument();
  });
});
