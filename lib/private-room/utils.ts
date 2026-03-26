const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomString(length: number) {
  let value = "";

  for (let i = 0; i < length; i += 1) {
    const index = Math.floor(Math.random() * ROOM_CODE_ALPHABET.length);
    value += ROOM_CODE_ALPHABET[index];
  }

  return value;
}

export function buildRoomCode() {
  return `PR-${randomString(6)}`;
}

export function buildChannelName() {
  return `private-${Date.now()}-${Math.floor(Math.random() * 1_000_000_000)}`;
}
