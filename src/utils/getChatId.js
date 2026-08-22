/**
 * Both users must read/write the same conversation document.
 * Sorting UIDs makes the id independent of who opened the chat first:
 *   getChatId("alice", "bob") === getChatId("bob", "alice")  →  "alice_bob"
 */
export function getChatId(uidA, uidB) {
  return [uidA, uidB].sort().join("_");
}
