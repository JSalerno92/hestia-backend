const messages = [
  {
    id: 'default',
    title: 'Default',
    message: 'Bienvenido a Hestia',
    subMessage: 'Cuidamos tu hogar como si fuera el nuestro',
    durationMs: 3500,
    isActive: true,
    isDefault: true,
    priority: 0
  },
  {
    id: 'christmas',
    title: 'Navidad',
    message: '🎄 Felices fiestas',
    subMessage: 'Agenda reducida durante las celebraciones',
    durationMs: 4000,
    validFrom: '2026-12-08',
    validTo: '2027-01-01',
    priority: 10,
    isActive: true
  }
];

function isWithinRange(message, now) {
  if (message.validFrom && now < new Date(message.validFrom)) return false;
  if (message.validTo && now > new Date(message.validTo)) return false;
  return true;
}

export function getActiveWelcomeMessage() {
  const now = new Date();

  const candidates = messages
    .filter(m => m.isActive)
    .filter(m => isWithinRange(m, now))
    .sort((a, b) => b.priority - a.priority);

  if (candidates.length > 0) return candidates[0];

  return messages.find(m => m.isDefault) || null;
}
