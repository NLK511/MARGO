export function getApiStatus() {
  return {
    service: 'margo-api',
    status: 'ready',
  } as const;
}

if (process.env.NODE_ENV !== 'test') {
  console.log(getApiStatus());
}
