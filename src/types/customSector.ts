import { SectorStock } from './market';

export interface CustomSectorStock {
  code: string;
  name: string;
  addedAt: string;
  notes?: string;
}

export interface CustomSector {
  id: string;
  name: string;
  description: string;
  tagColor: string; // 'rose' | 'indigo' | 'emerald' | 'amber' | 'purple' | 'cyan' | 'blue'
  createdAt: string;
  updatedAt: string;
  stocks: CustomSectorStock[];
}

export interface CustomSectorFundFlow {
  sectorId: string;
  name: string;
  tagColor: string;
  description: string;
  changePercent: number; // %
  mainNetInflow: number; // 亿元
  mainNetRatio: number; // %
  superLargeInflow: number; // 亿元
  largeInflow: number; // 亿元
  mediumInflow: number; // 亿元
  smallInflow: number; // 亿元
  totalTurnover: number; // 亿元
  turnoverRate: number; // %
  stocksCount: number;
  upCount: number;
  downCount: number;
  flatCount: number;
  leadStock?: SectorStock;
  dragStock?: SectorStock;
  topInflowStock?: SectorStock;
  stocks: SectorStock[];
}
