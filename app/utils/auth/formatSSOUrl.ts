export const formatSSOUrl = (url: string) => {
  const currentUrl = typeof window !== "undefined" ? window.location.href : ""
  return `${url}?callbackUrl=${encodeURIComponent(currentUrl)}`
}