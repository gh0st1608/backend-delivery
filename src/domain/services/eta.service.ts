export interface EtaService {
  calculate(input: {
    from: { lat: number; lng: number };
    to: { lat: number; lng: number };
  }): {
    distanceKm: number;
    etaMinutes: number;
  };
}

export const EtaServiceSymbol = Symbol('EtaService');