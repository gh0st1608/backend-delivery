export interface CourierLocationPayload {
  courierId: string;
  lat: number;
  lng: number;
  heading?: number;   // grados (0-360)
  speed?: number;     // m/s o km/h
  accuracy?: number; // metros (GPS)
  ts: number;         // Date.now()
}
