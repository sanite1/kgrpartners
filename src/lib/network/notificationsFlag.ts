// Switched off: the bell's polling was a large share of the backend's
// daily requests. Flip to true (and remount the backend route) to bring
// it back. Kept in its own file so the query client can read it without
// importing the API layer.
export const NOTIFICATIONS_ENABLED = false;
