type ErrorDetails = {
  code?: unknown;
  details?: unknown;
  message?: unknown;
};

export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!error || typeof error !== 'object') {
    return error instanceof Error ? error.message : fallback;
  }

  const details = error as ErrorDetails;
  const message = typeof details.message === 'string' ? details.message : '';
  const metadata = `${message} ${typeof details.details === 'string' ? details.details : ''}`;

  if (details.code === 'PGRST202' || /could not find the function public\.place_order/i.test(message)) {
    return 'Online order saving is not set up in Supabase yet. Ask the salon admin to run the Orders SQL from README.md.';
  }
  if (details.code === '42501' || /row-level security|permission denied/i.test(message)) {
    return 'Supabase denied this action. Check that you are signed in with the admin account and that its access policies are set up.';
  }
  if (details.code === '23505' && /slug/i.test(metadata)) {
    return 'That product URL is already in use. Please try saving again so an available URL can be generated.';
  }
  if (/failed to fetch|networkerror|network request failed/i.test(message)) {
    return 'Could not connect to the server. Check your internet connection and try again.';
  }
  return message || fallback;
}
