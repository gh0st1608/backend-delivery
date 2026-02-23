import { Injectable } from '@nestjs/common';
import { EtaService } from '../../domain/services/eta.service';

@Injectable()
export class EtaServiceImpl implements EtaService {
  calculate({ from, to }: {
    from: { lat: number; lng: number };
    to: { lat: number; lng: number };
  }) {
    const R = 6371; // km
    const dLat = this.deg2rad(to.lat - from.lat);
    const dLng = this.deg2rad(to.lng - from.lng);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.deg2rad(from.lat)) *
        Math.cos(this.deg2rad(to.lat)) *
        Math.sin(dLng / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c;

    const avgSpeedKmh = 25;
    const etaMinutes = Math.ceil((distanceKm / avgSpeedKmh) * 60);

    return {
      distanceKm: Number(distanceKm.toFixed(2)),
      etaMinutes,
    };
  }

  private deg2rad(deg: number) {
    return deg * (Math.PI / 180);
  }
}
