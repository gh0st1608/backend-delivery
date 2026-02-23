import { DeliveryPhase } from "../order.entity";

export interface CourierAssignedSocketEvent {
  orderId: string;
  courierId: string;
}

export interface CourierLocationSocketEvent {
  orderId: string;
  phase: DeliveryPhase ;
  courier: {
    id: string;
    name: string;
  };
  location: {
    lat: number;
    lng: number;
  };
  pickup: {
    lat: number;
    lng: number;
  };
  dropoff: {
    lat: number;
    lng: number;
  };
  eta: {
    distanceKm: number;
    etaMinutes: number;
  };
}
