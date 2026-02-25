export type PrivateRoomFriend = {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  status?: "Invited" | "Joined";
};

export const PRIVATE_ROOM_FRIENDS: PrivateRoomFriend[] = [
  { id: "f-1", name: "Aria Stone", handle: "@ariastone", avatar: "AS" },
  { id: "f-2", name: "Milo Hart", handle: "@milo", avatar: "MH" },
  { id: "f-3", name: "Lina Noor", handle: "@linanoor", avatar: "LN" },
  { id: "f-4", name: "Theo Vale", handle: "@theov", avatar: "TV" },
  { id: "f-5", name: "Nora Kim", handle: "@norakim", avatar: "NK" },
  { id: "f-6", name: "Jules Reed", handle: "@jules", avatar: "JR" }
];
