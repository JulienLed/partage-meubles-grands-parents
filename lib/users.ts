export const VALID_USERS = [
  "Augustin", "Simon", "Louise", "Victor", "Mathilde",
  "Rosalie", "Ariane", "Julien", "Aurore", "Catherine",
  "Christophe", "Sylvie", "Marion", "Eloïse",
  "Pierre", "Marc", "Eric", "Pascale", "Anne",
] as const;

export type ValidUser = typeof VALID_USERS[number];

export function isValidUser(name: unknown): name is ValidUser {
  return typeof name === "string" && (VALID_USERS as readonly string[]).includes(name);
}
