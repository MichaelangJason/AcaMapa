type ISODateString = string;

export type User = {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export type Session = {
  user?: User;
  expires: ISODateString;
};
