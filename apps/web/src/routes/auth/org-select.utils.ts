export function getSelectionErrorMessage(status?: number): string {
  if (status === 403) return 'You do not have permission to access this organization.'
  if (status === 404) return 'Organization not found.'
  return 'Failed to select organization. Please try again.'
}
