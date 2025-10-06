// Helper functions to stop all active sorting operations

export function stopAllOperations(activeInterval, activeTimeouts) {
  // Clear interval if exists
  if (activeInterval) {
    clearInterval(activeInterval);
    activeInterval = null;
  }

  // Clear all timeouts
  activeTimeouts.forEach(timeout => clearTimeout(timeout));
  activeTimeouts.length = 0;

  return { activeInterval, activeTimeouts };
}
