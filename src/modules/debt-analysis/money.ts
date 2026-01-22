export function getScale(decimals = 2): number {
  return 10 ** decimals;
}

export function toScaled(value: number, decimals = 2): number {
  return Math.round(value * getScale(decimals));
}

export function fromScaled(value: number, decimals = 2): number {
  const scale = getScale(decimals);
  return Number((value / scale).toFixed(decimals));
}

export function roundTo(value: number, decimals = 2): number {
  return fromScaled(toScaled(value, decimals), decimals);
}
