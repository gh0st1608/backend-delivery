// El access token solo transporta el identificador opaco del usuario (claim "sub")
export interface AuthenticatedUser {
  userId: string;
}
