import 'koa';

declare module 'koa' {
  interface Context {
    user?: {
      id: string;
      google_id: string;
      email: string;
      name: string;
      avatar_url: string;
    };
  }
}

declare module 'passport' {
  interface Authenticator {
    serializeUser<TID>(
      fn: (
        user: {
          id: string;
          google_id: string;
          email: string;
          name: string;
          avatar_url: string;
        },
        done: (err: any, id?: TID) => void
      ) => void
    ): void;

    deserializeUser<TID>(
      fn: (
        id: TID,
        done: (
          err: any,
          user?: {
            id: string;
            google_id: string;
            email: string;
            name: string;
            avatar_url: string;
          }
        ) => void
      ) => void
    ): void;
  }
}
