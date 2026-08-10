import type { Template } from '../types';

export const TEMPLATES: Template[] = [
  {
    id: 'white',
    label: '화이트',
    background: '#ffffff',
    textColorDefault: '#333333',
  },
  {
    id: 'ivory',
    label: '아이보리',
    background: '#faf6f0',
    textColorDefault: '#4a4238',
  },
  {
    id: 'blush',
    label: '블러쉬 핑크',
    background: '#fbeef0',
    backgroundGradient: ['#fdf3f4', '#f6dde1'],
    textColorDefault: '#6b4550',
  },
  {
    id: 'sage',
    label: '세이지 그린',
    background: '#eef1e9',
    backgroundGradient: ['#f2f4ec', '#dfe6d4'],
    textColorDefault: '#3f4a37',
  },
  {
    id: 'navy',
    label: '딥 네이비',
    background: '#1f2740',
    backgroundGradient: ['#232c47', '#161c30'],
    textColorDefault: '#f3ead9',
  },
  {
    id: 'terracotta',
    label: '테라코타',
    background: '#f1e0d3',
    backgroundGradient: ['#f4e5da', '#e4c3ab'],
    textColorDefault: '#5b3a2a',
  },
];
