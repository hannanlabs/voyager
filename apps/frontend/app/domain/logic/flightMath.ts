export function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

export function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = toRadians(lon2 - lon1);
  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);

  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);

  const bearing = Math.atan2(y, x);
  return (toDegrees(bearing) + 360) % 360;
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function calculateSpeed(velocity: { x: number; y: number; z: number }): number {
  return Math.sqrt(velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2);
}

export function interpolatePosition(
  start: { latitude: number; longitude: number },
  end: { latitude: number; longitude: number },
  progress: number,
): { latitude: number; longitude: number } {
  // Clamp progress to [0, 1]
  progress = Math.max(0, Math.min(1, progress));

  // Convert to radians
  const lat1 = toRadians(start.latitude);
  const lon1 = toRadians(start.longitude);
  const lat2 = toRadians(end.latitude);
  const lon2 = toRadians(end.longitude);

  // Calculate great circle distance
  const d = Math.acos(
    Math.sin(lat1) * Math.sin(lat2) + Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1),
  );

  // Handle edge cases
  if (Math.abs(d) < 1e-10) {
    return start; // Points are the same
  }

  // Interpolate along great circle
  const a = Math.sin((1 - progress) * d) / Math.sin(d);
  const b = Math.sin(progress * d) / Math.sin(d);

  const x = a * Math.cos(lat1) * Math.cos(lon1) + b * Math.cos(lat2) * Math.cos(lon2);
  const y = a * Math.cos(lat1) * Math.sin(lon1) + b * Math.cos(lat2) * Math.sin(lon2);
  const z = a * Math.sin(lat1) + b * Math.sin(lat2);

  const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
  const lon = Math.atan2(y, x);

  return {
    latitude: toDegrees(lat),
    longitude: toDegrees(lon),
  };
}

export function calculateProgress(
  current: { latitude: number; longitude: number },
  start: { latitude: number; longitude: number },
  end: { latitude: number; longitude: number },
): number {
  const totalDistance = calculateDistance(
    start.latitude,
    start.longitude,
    end.latitude,
    end.longitude,
  );
  const coveredDistance = calculateDistance(
    start.latitude,
    start.longitude,
    current.latitude,
    current.longitude,
  );
  return Math.min(1, Math.max(0, coveredDistance / totalDistance));
}
