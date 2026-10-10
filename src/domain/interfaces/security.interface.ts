// El token solo transporta el identificador opaco del usuario (claim "sub").
// Nombre, email o roles se consultan en el servidor, nunca viajan en el JWT.
export interface AuthenticatedUser {
  userId: string;
}
