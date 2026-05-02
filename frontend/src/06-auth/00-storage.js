function getStoredAuth() {
  try {
    var t = localStorage.getItem('cspsr_token');
    var u = localStorage.getItem('cspsr_user');
    var p = localStorage.getItem('cspsr_perms');
    if (t && u) return { token:t, user:JSON.parse(u), permissions:JSON.parse(p||'[]') };
  } catch(e) {}
  return null;
}
function setStoredAuth(token, user, permissions) {
  try {
    localStorage.setItem('cspsr_token', token);
    localStorage.setItem('cspsr_user', JSON.stringify(user));
    localStorage.setItem('cspsr_perms', JSON.stringify(permissions||[]));
  } catch(e) {}
}
function clearStoredAuth() {
  try { localStorage.removeItem('cspsr_token'); localStorage.removeItem('cspsr_user'); localStorage.removeItem('cspsr_perms'); } catch(e) {}
}

/* â•â•â• LOGIN SCREEN â•â•â• */
