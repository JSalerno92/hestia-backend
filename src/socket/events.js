let ioInstance;

export function registerIO(io) {
  ioInstance = io;
}

export function emitBookingCreated(booking) {
  if (!ioInstance) return;

  ioInstance.emit('booking:created', booking);
}
